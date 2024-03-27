import React from "react";
type Args = {
    errorHandler: (error: unknown) => void;
    setLoggedInUser: React.Dispatch<React.SetStateAction<CometChat.User | null>>;
};
export declare function Hooks(args: Args): void;
export {};
