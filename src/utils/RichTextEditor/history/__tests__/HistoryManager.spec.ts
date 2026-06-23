import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryManager } from '../HistoryManager';

describe('HistoryManager', () => {
  let manager: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new HistoryManager();
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('push', () => {
    it('should add an entry after debounce', () => {
      manager.push('<p>hello</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>world</p>');
      vi.advanceTimersByTime(300);

      expect(manager.canUndo()).toBe(true);
    });

    it('should debounce rapid pushes', () => {
      manager.push('<p>a</p>');
      manager.push('<p>b</p>');
      manager.push('<p>c</p>');
      vi.advanceTimersByTime(300);

      // Only the last one should be stored
      expect(manager.canUndo()).toBe(false); // only 1 entry
    });

    it('should not duplicate identical entries', () => {
      manager.push('<p>same</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>same</p>');
      vi.advanceTimersByTime(300);

      expect(manager.canUndo()).toBe(false);
    });

    it('should truncate forward history on new edit', () => {
      manager.push('<p>first</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>second</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>third</p>');
      vi.advanceTimersByTime(300);

      manager.undo(); // back to second
      manager.push('<p>branch</p>');
      vi.advanceTimersByTime(300);

      // redo should not be available since we branched
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should return null when no history', () => {
      expect(manager.undo()).toBeNull();
    });

    it('should return null when at beginning', () => {
      manager.push('<p>only</p>');
      vi.advanceTimersByTime(300);
      expect(manager.undo()).toBeNull();
    });

    it('should return previous html', () => {
      manager.push('<p>first</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>second</p>');
      vi.advanceTimersByTime(300);

      expect(manager.undo()).toBe('<p>first</p>');
    });

    it('should support multiple undos', () => {
      manager.push('<p>a</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>b</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>c</p>');
      vi.advanceTimersByTime(300);

      expect(manager.undo()).toBe('<p>b</p>');
      expect(manager.undo()).toBe('<p>a</p>');
      expect(manager.undo()).toBeNull();
    });
  });

  describe('redo', () => {
    it('should return null when at end', () => {
      manager.push('<p>only</p>');
      vi.advanceTimersByTime(300);
      expect(manager.redo()).toBeNull();
    });

    it('should return next html after undo', () => {
      manager.push('<p>first</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>second</p>');
      vi.advanceTimersByTime(300);

      manager.undo();
      expect(manager.redo()).toBe('<p>second</p>');
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo should be false initially', () => {
      expect(manager.canUndo()).toBe(false);
    });

    it('canRedo should be false initially', () => {
      expect(manager.canRedo()).toBe(false);
    });

    it('canUndo should be true after multiple pushes', () => {
      manager.push('<p>a</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>b</p>');
      vi.advanceTimersByTime(300);

      expect(manager.canUndo()).toBe(true);
    });

    it('canRedo should be true after undo', () => {
      manager.push('<p>a</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>b</p>');
      vi.advanceTimersByTime(300);

      manager.undo();
      expect(manager.canRedo()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should reset all history', () => {
      manager.push('<p>a</p>');
      vi.advanceTimersByTime(300);
      manager.push('<p>b</p>');
      vi.advanceTimersByTime(300);

      manager.clear();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.undo()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clear timers without error', () => {
      manager.push('<p>pending</p>'); // starts a timer
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('capacity limit', () => {
    it('should not exceed MAX_HISTORY (100) entries', () => {
      for (let i = 0; i < 110; i++) {
        manager.push(`<p>${String(i)}</p>`);
        vi.advanceTimersByTime(300);
      }

      // Should be able to undo up to ~99 times (100 entries, index starts at last)
      let undoCount = 0;
      while (manager.undo() !== null) {
        undoCount++;
      }
      expect(undoCount).toBeLessThanOrEqual(99);
    });
  });
});
