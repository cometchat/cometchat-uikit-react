import { describe, it, expect } from 'vitest';
import { CometChatTextFormatter } from '../CometChatTextFormatter';
import { applyDisplayFormatters } from '../applyDisplayFormatters';

class ColorFormatter extends CometChatTextFormatter {
  readonly id = 'color';
  override priority = 60;
  getRegex(): RegExp {
    return /\{color:(#[0-9a-fA-F]{3,6})\}([\s\S]*?)\{\/color\}/g;
  }
  format(text: string): string {
    return text.replace(
      this.getRegex(),
      (_m, c: string, b: string) => `<span style="color:${c}">${b}</span>`
    );
  }
}

class UpperFormatter extends CometChatTextFormatter {
  readonly id = 'upper';
  override priority = 10; // runs first
  getRegex(): RegExp {
    return /!!(.*?)!!/g;
  }
  format(text: string): string {
    return text.replace(this.getRegex(), (_m, b: string) => b.toUpperCase());
  }
}

describe('applyDisplayFormatters', () => {
  it('applies a custom formatter to a token in preview text', () => {
    const out = applyDisplayFormatters('hi {color:#f00}there{/color}', [new ColorFormatter()]);
    expect(out).toBe('hi <span style="color:#f00">there</span>');
  });

  it('leaves text without matching tokens unchanged', () => {
    expect(applyDisplayFormatters('just text', [new ColorFormatter()])).toBe('just text');
  });

  it('runs formatters in priority order (lower first)', () => {
    const out = applyDisplayFormatters('!!hi!! {color:#0f0}x{/color}', [
      new ColorFormatter(),
      new UpperFormatter(),
    ]);
    expect(out).toBe('HI <span style="color:#0f0">x</span>');
  });

  it('returns text unchanged when no formatters provided', () => {
    expect(applyDisplayFormatters('x', undefined)).toBe('x');
    expect(applyDisplayFormatters('x', [])).toBe('x');
  });

  it('a throwing formatter does not break the pipeline', () => {
    class Bad extends CometChatTextFormatter {
      readonly id = 'bad';
      getRegex(): RegExp {
        return /x/g;
      }
      format(): string {
        throw new Error('boom');
      }
    }
    expect(
      applyDisplayFormatters('{color:#f00}ok{/color}', [new Bad(), new ColorFormatter()])
    ).toBe('<span style="color:#f00">ok</span>');
  });
});
