import { CometChatEmojiKeyboard, CometChatIconButton, CometChatButton, CometChatDate, CometChatLabel, CometChatLoader, CometChatAvatar, CometChatReceipt } from "@cometchat/uikit-elements";
import { CometChatReactions } from "@cometchat/uikit-shared";
/**
 * Converts Lit web components into React components using the createComponent function from lit labs. This conversion allows these components to be seamlessly integrated and used within a React application while preserving their original functionalities and event handling capabilities.
 **/
/**
 * Converts CometChatReactions Lit web component to a React component using createComponent from lit labs. This can be used to show a list of reactions for a particular message. It can be customized using the style class of this component.For more details, go to [CometChatReactions](https://www.cometchat.com/docs-beta/ui-kit/react/reaction)
 *
 */
export declare const CometChatReactionsView: import("@lit-labs/react").ReactWebComponent<CometChatReactions, {}>;
/**
 * Converts CometChatEmojiKeyboard Lit web component to a React component using createComponent from lit labs. This can be used to show a list of emojis, which returns a particular emoji on click. It can be customized using the style class of this component.For more details, go to [CometChatEmojiKeyboard](https://www.cometchat.com/docs-beta/ui-kit/react/emoji-keyboard)
 *
 */
export declare const CometChatEmojiKeyboardView: import("@lit-labs/react").ReactWebComponent<CometChatEmojiKeyboard, {
    onEmojiClick: string;
}>;
/**
 * Converts CometChatIconButton Lit web component to a React component using createComponent from lit labs. This can be used to display a button which has an icon, a button, or both. It can be customized using the style class of this component.For more details, go to [CometChatIconButton](https://www.cometchat.com/docs-beta/ui-kit/react/icon-button)
 */
export declare const CometChatIconButtonView: import("@lit-labs/react").ReactWebComponent<CometChatIconButton, {
    buttonClick: string;
}>;
/**
 * Converts CometChatButton Lit web component to a React component using createComponent from lit labs. It can be used to display a button with customizable text. It can be customized using the style class of this component.
 */
export declare const CometChatButtonView: import("@lit-labs/react").ReactWebComponent<CometChatButton, {
    buttonClick: string;
}>;
/**
 * Converts CometChatDate Lit web component to a React component using createComponent from lit labs. It can be used to display a date in different time formats by providing the enum and timestamp. It can be customized using the style class of this component.For more details, go to [CometChatDate](https://www.cometchat.com/docs-beta/ui-kit/react/date)
 */
export declare const CometChatDateView: import("@lit-labs/react").ReactWebComponent<CometChatDate, {}>;
/**
 * Converts CometChatLabel Lit web component to a React component using createComponent from lit labs. It can be used to display normal text or a title with customizable text. It can be customized using the style class of this component.For more details, go to [CometChatLabel](https://www.cometchat.com/docs-beta/ui-kit/react/label)
 */
export declare const CometChatLabelView: import("@lit-labs/react").ReactWebComponent<CometChatLabel, {}>;
/**
 * Converts CometChatLoader Lit web component to a React component using createComponent from lit labs. It can be used to display a loading icon which is customizable. By default, it has a loading icon inside the component. It can be customized using the style class of this component.For more details, go to [CometChatLoader](https://www.cometchat.com/docs-beta/ui-kit/react/loader)
 */
export declare const CometChatLoaderView: import("@lit-labs/react").ReactWebComponent<CometChatLoader, {}>;
/**
 * Converts CometChatAvatar Lit web component to a React component using createComponent from lit labs. It can be used to display a user/group image with a fallback name if the URL is not present. It can be customized using the style class of this component. For more details, go to [CometChatAvatar](https://www.cometchat.com/docs-beta/ui-kit/react/avatar)
 */
export declare const CometChatAvatarView: import("@lit-labs/react").ReactWebComponent<CometChatAvatar, {}>;
/**
 * Converts CometChatReceipt Lit web component to a React component using createComponent from lit labs. It can be used to display various types of receipt statuses for a message (like sent, delivered, etc.) which can be customized by sending the enum for which state to be shown. It can be customized using the style class of this component.For more details, go to [CometChatReceipt](https://www.cometchat.com/docs-beta/ui-kit/react/receipt)
 */
export declare const CometChatReceiptView: import("@lit-labs/react").ReactWebComponent<CometChatReceipt, {}>;
