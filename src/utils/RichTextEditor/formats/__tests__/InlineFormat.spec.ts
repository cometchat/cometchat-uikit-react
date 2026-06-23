/* eslint-disable @typescript-eslint/no-deprecated, @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearInlineOverrides,
  deactivateUnderline,
  isDeactivated,
  isActivated,
  queryInlineFormatState,
  BoldFormat,
  ItalicFormat,
  UnderlineFormat,
  StrikethroughFormat,
} from '../InlineFormat';
import type { EditorContext } from '../format.types';

// jsdom doesn't implement execCommand or queryCommandState
beforeEach(() => {
  document.execCommand = vi.fn().mockReturnValue(true);
  document.queryCommandState = vi.fn().mockReturnValue(false);
});

function createMockCtx(overrides: Partial<EditorContext> = {}): EditorContext {
  return {
    element: document.createElement('div'),
    focus: vi.fn(),
    execCommand: (command: string) => document.execCommand(command, false),
    getDocument: () => document,
    getWindow: () => window,
    markFormattingApplied: vi.fn(),
    updateFormatState: vi.fn(),
    pushHistory: vi.fn(),
    emitUpdate: vi.fn(),
    hasAncestor: vi.fn().mockReturnValue(false),
    findAncestor: vi.fn().mockReturnValue(null),
    ...overrides,
  } as unknown as EditorContext;
}

describe('InlineFormat utilities', () => {
  beforeEach(() => {
    clearInlineOverrides();
  });

  describe('clearInlineOverrides', () => {
    it('should clear deactivated and activated formats', () => {
      deactivateUnderline();
      expect(isDeactivated('underline')).toBe(true);
      clearInlineOverrides();
      expect(isDeactivated('underline')).toBe(false);
    });
  });

  describe('deactivateUnderline', () => {
    it('should mark underline as deactivated', () => {
      deactivateUnderline();
      expect(isDeactivated('underline')).toBe(true);
      expect(isActivated('underline')).toBe(false);
    });
  });

  describe('isDeactivated / isActivated', () => {
    it('should return false by default', () => {
      expect(isDeactivated('bold')).toBe(false);
      expect(isActivated('bold')).toBe(false);
    });
  });

  describe('queryInlineFormatState', () => {
    it('should return false when format is deactivated', () => {
      deactivateUnderline();
      const ctx = createMockCtx();
      const node = document.createTextNode('test');
      expect(queryInlineFormatState('underline', node, ['U'], ctx)).toBe(false);
    });

    it('should use hasAncestor as fallback when queryCommandState throws', () => {
      const ctx = createMockCtx({
        hasAncestor: vi.fn().mockReturnValue(true),
      });
      const node = document.createTextNode('test');

      (document.queryCommandState as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('not supported');
      });

      expect(queryInlineFormatState('bold', node, ['STRONG', 'B'], ctx)).toBe(true);
      expect(ctx.hasAncestor).toHaveBeenCalledWith(node, 'STRONG');
    });
  });

  describe('BoldFormat', () => {
    it('should have id "bold"', () => {
      expect(BoldFormat.id).toBe('bold');
    });

    it('should have name "Bold"', () => {
      expect(BoldFormat.name).toBe('Bold');
    });

    it('should call execCommand on execute', () => {
      const ctx = createMockCtx();

      BoldFormat.execute(ctx);

      expect(ctx.focus).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
      expect(ctx.updateFormatState).toHaveBeenCalled();
      expect(ctx.pushHistory).toHaveBeenCalled();
      expect(ctx.emitUpdate).toHaveBeenCalled();
    });
  });

  describe('ItalicFormat', () => {
    it('should have id "italic"', () => {
      expect(ItalicFormat.id).toBe('italic');
    });

    it('should call execCommand on execute', () => {
      const ctx = createMockCtx();

      ItalicFormat.execute(ctx);

      expect(document.execCommand).toHaveBeenCalledWith('italic', false);
    });
  });

  describe('UnderlineFormat', () => {
    it('should have id "underline"', () => {
      expect(UnderlineFormat.id).toBe('underline');
    });

    it('should call execCommand on execute', () => {
      const ctx = createMockCtx();

      UnderlineFormat.execute(ctx);

      expect(document.execCommand).toHaveBeenCalledWith('underline', false);
    });
  });

  describe('StrikethroughFormat', () => {
    it('should have id "strikethrough"', () => {
      expect(StrikethroughFormat.id).toBe('strikethrough');
    });

    it('should call execCommand with "strikeThrough"', () => {
      const ctx = createMockCtx();

      StrikethroughFormat.execute(ctx);

      expect(document.execCommand).toHaveBeenCalledWith('strikeThrough', false);
    });
  });
});
