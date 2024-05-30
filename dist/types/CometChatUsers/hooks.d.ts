import React from "react";
import { Action } from ".";
import { UsersManager } from "./controller";
type Args = {
    usersManagerRef: React.MutableRefObject<UsersManager | null>;
    fetchNextAndAppendUsers: (fetchId: string) => Promise<void>;
    searchText: string;
    usersRequestBuilder: CometChat.UsersRequestBuilder | null;
    searchRequestBuilder: CometChat.UsersRequestBuilder | null;
    dispatch: React.Dispatch<Action>;
    updateUser: (user: CometChat.User) => void;
    fetchNextIdRef: React.MutableRefObject<string>;
    searchKeyword: string;
    disableLoadingState: boolean;
    usersSearchText: React.MutableRefObject<string>;
};
export declare function Hooks(args: Args): void;
export {};
