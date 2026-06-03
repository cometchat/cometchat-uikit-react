import { describe, it, expect } from 'vitest';
import { CometChatTextFormatter } from '../CometChatTextFormatter';

// Concrete subclass for testing the abstract base
class TestFormatter extends CometChatTextFormatter {
  readonly id = 'test-formatter';
  getRegex(): RegExp {
    return /test/g;
  }
  format(text: string): string {
    this.originalText = text;
    this.formattedText = text.replace(this.getRegex(), '<b>test</b>');
    return this.formattedText;
  }
}

describe('CometChatTextFormatter', () => {
  it('subclass implements id, getRegex, and format', () => {
    const formatter = new TestFormatter();
    expect(formatter.id).toBe('test-formatter');
    expect(formatter.getRegex()).toBeInstanceOf(RegExp);
    expect(formatter.format('hello test world')).toBe('hello <b>test</b> world');
  });

  it('stores original and formatted text', () => {
    const formatter = new TestFormatter();
    formatter.format('hello test');
    expect(formatter.getOriginalText()).toBe('hello test');
    expect(formatter.getFormattedText()).toBe('hello <b>test</b>');
  });

  it('shouldFormat returns true by default', () => {
    const formatter = new TestFormatter();
    expect(formatter.shouldFormat('any text')).toBe(true);
  });

  it('default priority is 100', () => {
    const formatter = new TestFormatter();
    expect(formatter.priority).toBe(100);
  });

  it('reset clears state', () => {
    const formatter = new TestFormatter();
    formatter.format('hello test');
    expect(formatter.getOriginalText()).toBe('hello test');
    formatter.reset();
    expect(formatter.getOriginalText()).toBe('');
    expect(formatter.getFormattedText()).toBe('');
    expect(formatter.getMetadata()).toEqual({});
  });

  it('getMetadata returns empty object by default', () => {
    const formatter = new TestFormatter();
    expect(formatter.getMetadata()).toEqual({});
  });
});
