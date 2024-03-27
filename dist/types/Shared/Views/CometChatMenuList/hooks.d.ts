import React, { JSX } from "react";
import { CometChatOption } from "@cometchat/uikit-resources";
type Args = {
    data: CometChatOption[];
    idToOnClickMapRef: React.MutableRefObject<Map<string | undefined, (() => void) | undefined> | null>;
    ref: React.MutableRefObject<JSX.IntrinsicElements["cometchat-menu-list"]>;
    onOptionClickPropRef: React.MutableRefObject<((customEvent: CustomEvent<{
        data: CometChatOption;
    }>) => void) | undefined>;
};
export declare function Hooks(args: Args): void;
export {};
