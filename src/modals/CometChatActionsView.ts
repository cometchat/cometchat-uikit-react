import { CometChatActions } from "./CometChatActions";
import { JSX } from "react";


/**
 * CometChatActionsView is a pre-defined structure for creating actions 
 * that the user can perform on a message with a customized UI view representation.
 * It is used in AI module, CometChatMessageBubble, CometChatMessageComposer, CometChatMessageList components. 
 */
export class CometChatActionsView extends CometChatActions {
    /**
     * User-defined component to customize the action view for each option in the template.
     * @type {callbacks: any) => Element | JSX.Element | undefined}
     */
    customView?: (callbacks: any) => Element | JSX.Element;

    /**
     * Creates an instance of CometChatActionsView.
     */
    constructor(options: {
        /**
        * Unique identifier for the message action.
        * @type {string}
        */
        id: string;

        /**
         * Heading text for the message action.
         * @type {string}
         */
        title: string;

        /**
         * Asset URL for the icon to symbolize a message action. This is optional and can be omitted.
         * @type {string}
         */
        iconURL?: string;

        /**
         * User-defined component to customize the action view. This is optional and can be omitted.
         * @type {Element | JSX.Element}
         */
        customView?: (callbacks: any) => Element | JSX.Element;
    }) {
        super(options);
        this.customView = options.customView;
    }
}