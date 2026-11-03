/**
 * Accessible names and hints must be translatable: an `aria-label`, `title`, `placeholder` or `alt`
 * whose value contains English text — a literal, a template, or a branch of a condition — stays
 * English in every language. Use getLocalizedString() with a key in every locale instead.
 *
 * The JSX is parsed, so text inside an expression is found too, and a value passed as a
 * variable (`aria-label={label}`) is followed to the variable's declarations in the same file.
 * Labels handed on to a kit component are checked the same way: an `ariaLabel` prop, and
 * `alt` / `ariaLabel` / `aria-label` set as object properties (`{ alt: altText }`).
 * Text passed to a call (the translation itself) and text that is only compared against
 * (`status === 'online'`) is not language text, nor is a fallback after a translation
 * (`t(key) ?? 'Tool call'`).
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const SRC = join(__dirname, "../../..");
const ATTRIBUTES = new Set([
  "aria-label",
  "ariaLabel",
  "title",
  "placeholder",
  "alt",
]);
const PROPERTIES = new Set(["alt", "ariaLabel", "aria-label"]);

// Literals that aren't language text.
const ALLOWED = new Set(["https://www.cometchat.com/"]);

// Labels known to be untranslated, while a fix is pending (none today). Remove an entry once
// its label is translated; the test fails while a fixed entry is still listed.
const KNOWN = new Set<string>([]);

const COMPARISONS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);
const FALLBACKS = new Set([
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.BarBarToken,
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return ["__tests__", "testing"].includes(name) ? [] : sourceFiles(path);
    return name.endsWith(".tsx") && !/\.(spec|test|stories)\.tsx$/.test(name)
      ? [path]
      : [];
  });
}

/** The language text in an attribute value; a template's expressions become "…". */
function textIn(node: ts.Node): string[] {
  if (ts.isCallExpression(node)) return [];
  if (ts.isBinaryExpression(node)) {
    if (COMPARISONS.has(node.operatorToken.kind)) return [];
    if (
      FALLBACKS.has(node.operatorToken.kind) &&
      ts.isCallExpression(node.left)
    )
      return [];
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return [node.text];
  if (ts.isTemplateExpression(node)) {
    const text = [
      node.head.text,
      ...node.templateSpans.map((span) => span.literal.text),
    ].join("…");
    const nested = node.templateSpans.flatMap((span) => textIn(span.expression));
    return [text, ...nested];
  }
  const found: string[] = [];
  node.forEachChild((child) => {
    found.push(...textIn(child));
  });
  return found;
}

function untranslatedAttributes(): Map<string, string> {
  const found = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const declarations = new Map<string, ts.Expression[]>();
    const collect = (node: ts.Node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        const known = declarations.get(node.name.text) ?? [];
        declarations.set(node.name.text, [...known, node.initializer]);
      }
      node.forEachChild(collect);
    };
    collect(source);

    /** The value, or the values of the variable it names. */
    const valuesOf = (value: ts.Node): ts.Node[] => {
      const expression = ts.isJsxExpression(value) ? value.expression : value;
      if (expression && ts.isIdentifier(expression))
        return declarations.get(expression.text) ?? [];
      return [value];
    };

    const check = (node: ts.Node, name: string, value: ts.Node) => {
      const text = valuesOf(value)
        .flatMap(textIn)
        .map((t) => t.trim())
        .filter((t) => /[A-Za-z]{2,}/.test(t) && !ALLOWED.has(t));
      if (text.length > 0) {
        const line =
          source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        found.set(
          `${relative(SRC, file)} ${name}: ${text.join(" | ")}`,
          `line ${String(line)}`,
        );
      }
    };

    const visit = (node: ts.Node) => {
      if (
        ts.isJsxAttribute(node) &&
        ATTRIBUTES.has(node.name.getText(source)) &&
        node.initializer
      ) {
        check(node, node.name.getText(source), node.initializer);
      }
      if (ts.isPropertyAssignment(node)) {
        const name = node.name.getText(source).replace(/["']/g, "");
        if (PROPERTIES.has(name)) check(node, name, node.initializer);
      }
      node.forEachChild(visit);
    };
    visit(source);
  }
  return found;
}

describe("hard-coded user-facing text", () => {
  const found = untranslatedAttributes();

  it("no component sets aria-label, title, placeholder or alt to English text", () => {
    const unexpected = [...found]
      .filter(([entry]) => !KNOWN.has(entry))
      .map(([entry, line]) => `${entry} (${line})`);
    expect(unexpected).toEqual([]);
  });

  it("the known list only names labels that are still untranslated", () => {
    expect([...KNOWN].filter((entry) => !found.has(entry))).toEqual([]);
  });
});
