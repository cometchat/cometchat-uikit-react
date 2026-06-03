import type { InputHTMLAttributes } from 'react';

/** Event payload emitted on checkbox state change. */
export interface CometChatCheckboxChangeEvent {
  /** Whether the checkbox is now checked. */
  checked: boolean;
  /** The label text, if provided. */
  label?: string;
  /** Whether the Shift key was held during the click. */
  shiftKey?: boolean;
  /** Whether the Meta/Cmd key was held during the click. */
  metaKey?: boolean;
}

/** Props for CometChatCheckbox. */
export interface CometChatCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'children'
> {
  /** Whether the checkbox is checked (controlled mode). */
  checked?: boolean;
  /** Default checked state (uncontrolled mode). */
  defaultChecked?: boolean;
  /** Label text displayed next to the checkbox. */
  label?: string;
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /** Callback fired when the checkbox value changes. */
  onChange?: (event: CometChatCheckboxChangeEvent) => void;
  /** Optional custom className. */
  className?: string;
}
