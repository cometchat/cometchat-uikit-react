import React, { JSX } from "react";
import { ModalInfo } from ".";
type Args = {
    setLoggedInUser: React.Dispatch<React.SetStateAction<CometChat.User | null>>;
    errorHandler: (error: unknown) => void;
    leaveOrTransferConfirmDialogElement: JSX.IntrinsicElements["cometchat-confirm-dialog"] | null;
    setModalInfo: React.Dispatch<React.SetStateAction<ModalInfo>>;
    handleLeaveOrTransferConfirmClick: (userOrGroup: CometChat.User | CometChat.Group) => Promise<void>;
    deleteConfirmDialogElement: JSX.IntrinsicElements["cometchat-confirm-dialog"] | null;
    handleDeleteConfirmClick: (userOrGroup: CometChat.User | CometChat.Group) => Promise<void>;
    userOrGroup: CometChat.User | CometChat.Group | undefined;
    user: CometChat.User | undefined;
    group: CometChat.Group | undefined;
    setUserOrGroup: React.Dispatch<React.SetStateAction<CometChat.User | CometChat.Group | undefined>>;
};
export declare function Hooks(args: Args): void;
export {};
