import React, { JSX } from "react";
import { CometChatButton } from ".";
type Args = {
    ref: React.MutableRefObject<JSX.IntrinsicElements["cometchat-button"]>;
    onClickPropRef: React.MutableRefObject<((customEvent: CustomEvent<{
        event: PointerEvent;
    }>) => void) | undefined>;
    childRefCallback?: (ref: React.RefObject<typeof CometChatButton>) => void;
};
export declare function Hooks(args: Args): void;
export {};
