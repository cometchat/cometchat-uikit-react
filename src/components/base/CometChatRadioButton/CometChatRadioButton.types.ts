import type { InputHTMLAttributes } from 'react';

/** Event payload emitted on radio button state change. */
export interface CometChatRadioButtonChangeEvent {
  /** Whether the radio button is now checked. */
  checked: boolean;
  /** The label text, if provided. */
  label?: string | undefined;
  /** The value of the radio button. */
  value?: string | undefined;
}

/** Props for CometChatRadioButton. */
export interface CometChatRadioButtonProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'children'
> {
  /** Whether the radio button is checked (controlled mode). */
  checked?: boolean;
  /** Default checked state (uncontrolled mode). */
  defaultChecked?: boolean;
  /** Label text displayed next to the radio button. */
  label?: string;
  /** Whether the radio button is disabled. */
  disabled?: boolean;
  /** Name for grouping radio buttons — only one in a group can be selected. */
  name?: string;
  /** Value of the radio button submitted with the form. */
  value?: string;
  /** Custom aria-label that overrides label for accessibility. */
  ariaLabel?: string;
  /** Callback fired when the radio button value changes. */
  onChange?: (event: CometChatRadioButtonChangeEvent) => void;
  /** Optional custom className. */
  className?: string;
}
