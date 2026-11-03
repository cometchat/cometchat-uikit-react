import { Page } from '../helpers/test';

export interface TokenEffect {
  /** Whether setting the token on `.cometchat` changed the computed style of an element on the page. */
  changed: boolean;
  /** The first element that changed, e.g. `div.cometchat-list-item__title`, and how. */
  element?: string;
  property?: string;
  before?: string;
  after?: string;
  /** The value that made the difference. */
  value?: string;
  /** How many elements were checked: those styled by a rule that reads the token. */
  checked: number;
}

/**
 * Set `token` on `.cometchat` (where an app sets it) and report whether that changes the computed
 * style of an element on the page.
 *
 * Only elements a stylesheet rule styles with the token are checked, directly or through other
 * theme tokens built from it (`--cometchat-border-color-default` reads `--cometchat-neutral-color-300`),
 * plus those of rules whose var() the browser hides (see below). The override is a value of the
 * token's kind (a colour, a length, a font, a shadow), and a few others if that changes nothing.
 * Transitions are switched off while comparing, so a change shows at once.
 */
export async function tokenEffect(page: Page, token: string): Promise<TokenEffect> {
  return page.evaluate(token => {
    const root = document.querySelector('.cometchat');
    if (!root) return { changed: false, checked: 0 };

    const rules: CSSStyleRule[] = [];
    const walk = (list: CSSRuleList) => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) rules.push(rule);
        const nested = (rule as CSSGroupingRule).cssRules as CSSRuleList | undefined;
        if (nested) walk(nested);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // A stylesheet from another origin (web fonts) can't be read; it styles nothing of ours.
      }
    }

    // Declarations as written: a shorthand that uses var() only shows in cssText.
    const declarations = rules.flatMap(rule =>
      rule.style.cssText
        .split(';')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => {
          const i = d.indexOf(':');
          return { rule, property: d.slice(0, i).trim(), value: d.slice(i + 1).trim() };
        })
    );
    const reads = (value: string, names: Set<string>) =>
      [...value.matchAll(/var\(\s*(--[\w-]+)/g)].some(([, name]) => names.has(name ?? ''));

    // The token, and every custom property built from it.
    const family = new Set([token]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const d of declarations) {
        if (d.property.startsWith('--') && !family.has(d.property) && reads(d.value, family)) {
          family.add(d.property);
          grew = true;
        }
      }
    }

    // Elements styled by a rule that reads it, with the pseudo-element the rule targets.
    const targets: { el: Element; pseudo: string | null }[] = [];
    const seen = new Set<string>();
    const addTargets = (rule: CSSStyleRule) => {
      for (const part of rule.selectorText.split(',')) {
        const pseudo = /::?(before|after|placeholder|marker)\s*$/.exec(part.trim());
        const selector = pseudo ? part.trim().slice(0, pseudo.index) : part.trim();
        let matches: Element[] = [];
        try {
          matches = Array.from(document.querySelectorAll(selector || '*'));
        } catch {
          continue;
        }
        for (const el of matches.slice(0, 3)) {
          const key = `${selector}|${pseudo?.[0] ?? ''}|${matches.indexOf(el)}`;
          if (seen.has(key) || !el.closest('.cometchat') || el.getClientRects().length === 0) continue;
          seen.add(key);
          targets.push({ el, pseudo: pseudo ? `::${pseudo[1] ?? ''}` : null });
        }
      }
    };
    for (const d of declarations) {
      if (d.property.startsWith('--') || !reads(d.value, family)) continue;
      addTargets(d.rule);
      if (targets.length >= 200) break;
    }
    // A shorthand that reads a var() and is then partly overridden in the same rule
    // (`font: var(--x); font-style: normal`) can't be written back as a shorthand: Chrome lists its
    // other longhands with empty values, and the var() is gone from cssText. Which token such a rule
    // reads can't be told, so its elements are checked for every token, after the others.
    const hidden = new Set(
      declarations.filter(d => d.value === '' && !d.property.startsWith('--')).map(d => d.rule)
    );
    for (const rule of hidden) {
      if (targets.length >= 200) break;
      addTargets(rule);
    }

    const freeze = document.createElement('style');
    freeze.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
    document.head.appendChild(freeze);
    const override = document.createElement('style');
    document.head.appendChild(override);

    // Real properties only: custom properties inherit the override, so they always change.
    const snapshot = () =>
      targets.map(({ el, pseudo }) => {
        const cs = getComputedStyle(el, pseudo);
        return Object.fromEntries(
          Array.from(cs)
            .filter(p => !p.startsWith('--'))
            .map(p => [p, cs.getPropertyValue(p)])
        );
      });

    const current = getComputedStyle(root).getPropertyValue(token).trim();
    const colour = 'rgb(1, 2, 3)';
    const length = /^(-?[\d.]+)px$/.exec(current);
    const kinds: string[] = [];
    if (/^(#|rgba?\(|hsla?\(|color\(|transparent$)/i.test(current)) kinds.push(colour);
    if (length) kinds.push(`${String(Number(length[1]) + 7)}px`);
    if (/\d+px.*[a-z]/i.test(current) && !/rgba?\(/.test(current)) kinds.push('italic 700 31px/37px monospace');
    if (/rgba?\(/.test(current) && /px/.test(current)) kinds.push('0 0 0 7px rgb(1, 2, 3)');
    if (/^\d{3}$/.test(current)) kinds.push(current === '900' ? '100' : '900');
    const candidates = [...new Set([...kinds, colour, '37px', 'italic 700 31px/37px monospace', '0 0 0 7px rgb(1, 2, 3)', '900', '0.3'])];

    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${Array.from(el.classList)
        .slice(0, 2)
        .map(c => `.${c}`)
        .join('')}`;

    const before = snapshot();
    let result: TokenEffect = { changed: false, checked: targets.length };
    for (const value of candidates) {
      override.textContent = `.cometchat { ${token}: ${value}; }`;
      const after = snapshot();
      const i = after.findIndex((styles, n) => Object.keys(styles).some(p => styles[p] !== before[n]?.[p]));
      if (i >= 0) {
        const target = targets[i];
        const property = Object.keys(after[i] ?? {}).find(p => after[i]?.[p] !== before[i]?.[p]) ?? '';
        result = {
          changed: true,
          checked: targets.length,
          element: target ? `${describe(target.el)}${target.pseudo ?? ''}` : '',
          property,
          before: before[i]?.[property],
          after: after[i]?.[property],
          value,
        };
        break;
      }
    }
    override.remove();
    freeze.remove();
    return result;
  }, token);
}
