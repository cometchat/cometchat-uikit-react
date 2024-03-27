import React from "react";
import { SelectionMode } from "@cometchat/uikit-resources";
type Args = {
    loggedInUserRef: React.MutableRefObject<CometChat.User | null>;
    errorHandler: (error: unknown) => void;
    selectionMode: SelectionMode;
    selectionModeRef: React.MutableRefObject<SelectionMode>;
    membersToAddRef: React.MutableRefObject<CometChat.GroupMember[]>;
};
export declare function Hooks(args: Args): void;
export {};
