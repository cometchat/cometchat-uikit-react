import React from "react";
import { Action } from ".";
import { BannedMembersManager } from "./controller";
type Args = {
    bannedMembersManagerRef: React.MutableRefObject<BannedMembersManager | null>;
    groupGuid: string;
    searchText: string;
    bannedMembersRequestBuilder: CometChat.BannedMembersRequestBuilder | null;
    searchRequestBuilder: CometChat.BannedMembersRequestBuilder | null;
    dispatch: React.Dispatch<Action>;
    fetchNextAndAppendBannedMembers: (fetchId: string) => Promise<void>;
    fetchNextIdRef: React.MutableRefObject<string>;
    groupPropRef: React.MutableRefObject<CometChat.Group>;
};
export declare function Hooks(args: Args): void;
export {};
