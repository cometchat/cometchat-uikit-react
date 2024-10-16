import React, { JSX } from "react";
import { Action } from ".";
import { GroupMembersManager } from "./controller";
type Args = {
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
    searchRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
    searchText: string;
    groupMembersManagerRef: React.MutableRefObject<GroupMembersManager | null>;
    groupGuid: string;
    fetchNextAndAppendGroupMembers: (id: string) => void;
    fetchNextIdRef: React.MutableRefObject<string>;
    dispatch: React.Dispatch<Action>;
    loggedInUserRef: React.MutableRefObject<CometChat.User | null>;
    errorHandler: (error: unknown) => void;
    changeScopeElement: JSX.IntrinsicElements["cometchat-change-scope"] | null;
    updateGroupMemberScope: (newScope: string) => Promise<void>;
    searchKeyword: string;
    disableLoadingState: boolean;
    groupMembersSearchText: React.MutableRefObject<string>;
};
export declare function Hooks(args: Args): void;
export {};
