/**
 * HistoryManager — manages undo/redo state for the rich text editor.
 *
 * Stores HTML snapshots with debounced pushes to avoid flooding the stack
 * on rapid typing. Supports undo, redo, and capacity limits.
 */

import type { CometChatHistoryEntry } from '../RichTextEditor.types';

const MAX_HISTORY = 100;
const HISTORY_DEBOUNCE_MS = 300;

export class HistoryManager {
  private history: CometChatHistoryEntry[] = [];
  private index = -1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Push a new state to the history stack (debounced). */
  push(html: string): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const last = this.history[this.index];
      if (last?.html === html) return;

      // Truncate forward history on new edit
      this.history = this.history.slice(0, this.index + 1);
      this.history.push({ html, cursorPosition: 0, timestamp: Date.now() });
      if (this.history.length > MAX_HISTORY) {
        this.history.shift();
      }
      this.index = this.history.length - 1;
    }, HISTORY_DEBOUNCE_MS);
  }

  /** Undo — move back in history. Returns the HTML to restore, or null if at the beginning. */
  undo(): string | null {
    if (this.index <= 0) return null;
    this.index--;
    const entry = this.history[this.index];
    return entry?.html ?? null;
  }

  /** Redo — move forward in history. Returns the HTML to restore, or null if at the end. */
  redo(): string | null {
    if (this.index >= this.history.length - 1) return null;
    this.index++;
    const entry = this.history[this.index];
    return entry?.html ?? null;
  }

  /** Whether undo is available. */
  canUndo(): boolean {
    return this.index > 0;
  }

  /** Whether redo is available. */
  canRedo(): boolean {
    return this.index < this.history.length - 1;
  }

  /** Reset all history. */
  clear(): void {
    this.history = [];
    this.index = -1;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Clean up the debounce timer. Call on destroy. */
  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
