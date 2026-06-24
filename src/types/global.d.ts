/** Global type augmentations for the browser `window` object. */
export {};

declare global {
  interface Window {
    /** UIKit metadata registered on the window for analytics/debugging/support. */
    CometChatUiKit?: {
      name: string;
      version: string;
    };
  }
}
