import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect, JSX } from "react";
import { ModalInfo } from ".";

type Args = {
    setLoggedInUser : React.Dispatch<React.SetStateAction<CometChat.User | null>>,
    errorHandler : (error : unknown) => void,
    leaveOrTransferConfirmDialogElement : JSX.IntrinsicElements["cometchat-confirm-dialog"] | null,
    setModalInfo : React.Dispatch<React.SetStateAction<ModalInfo>>,
    handleLeaveOrTransferConfirmClick : (userOrGroup : CometChat.User | CometChat.Group) => Promise<void>,
    deleteConfirmDialogElement : JSX.IntrinsicElements["cometchat-confirm-dialog"] | null,
    handleDeleteConfirmClick : (userOrGroup : CometChat.User | CometChat.Group) => Promise<void>,
    userOrGroup : CometChat.User | CometChat.Group | undefined
};

export function Hooks(args : Args) {
    const {
        setLoggedInUser,
        errorHandler,
        leaveOrTransferConfirmDialogElement,
        setModalInfo,
        handleLeaveOrTransferConfirmClick,
        deleteConfirmDialogElement,
        handleDeleteConfirmClick,
        userOrGroup
    } = args;

    useEffect(
        /**
         * Adds `cc-confirm-clicked` to the leave or transfer confirm dialog element
         */
        () => {
            if (!leaveOrTransferConfirmDialogElement) {
                return;
            }
            const confirmClickEventName = "cc-confirm-clicked";
            const handleEvent = () => {
                if (userOrGroup) {
                    handleLeaveOrTransferConfirmClick(userOrGroup);
                }
            };
            leaveOrTransferConfirmDialogElement.addEventListener(confirmClickEventName, handleEvent);
            return () => {
                leaveOrTransferConfirmDialogElement.removeEventListener(confirmClickEventName, handleEvent);
            };
    }, [leaveOrTransferConfirmDialogElement, handleLeaveOrTransferConfirmClick, userOrGroup]);

    useEffect(
        /**
         * Adds `cc-cancel-clicked` event handler to the leave or transfer confirm dialog element
         */
        () => {
            if (!leaveOrTransferConfirmDialogElement) {
                return;
            }
            const cancelClickEventName = "cc-cancel-clicked";
            const handleCancelClick = () => setModalInfo(null);
            leaveOrTransferConfirmDialogElement.addEventListener(cancelClickEventName, handleCancelClick);
            return () => {
                leaveOrTransferConfirmDialogElement.removeEventListener(cancelClickEventName, handleCancelClick);
            };
    }, [leaveOrTransferConfirmDialogElement, setModalInfo]);

    useEffect(
        /**
         * Adds `cc-confirm-clicked` to the delete confirm dialog element
         */
        () => {
            if (!deleteConfirmDialogElement) {
                return;
            }
            const eventName = "cc-confirm-clicked";
            const handleEvent = () => {
                if (userOrGroup) {
                    handleDeleteConfirmClick(userOrGroup);
                }
            };
            deleteConfirmDialogElement.addEventListener(eventName, handleEvent);
            return () => {
                deleteConfirmDialogElement.removeEventListener(eventName, handleEvent);
            };
    }, [deleteConfirmDialogElement, handleDeleteConfirmClick, userOrGroup]);

    useEffect(
        /**
         * Adds `cc-cancel-clicked` event handler to the delete confirm dialog element
         */
        () => {
            if (!deleteConfirmDialogElement) {
                return;
            }
            const eventName = "cc-cancel-clicked";
            const handleEvent = function() {
                setModalInfo(null);
            };
            deleteConfirmDialogElement.addEventListener(eventName, handleEvent);
            return () => {
                deleteConfirmDialogElement.removeEventListener(eventName, handleEvent);
            };
    }, [deleteConfirmDialogElement, setModalInfo]);

    useEffect(
        /**
         * Sets the `loggedInUser` state to the currently logged-in user
         */
        () => {
            (async () => {
                try {
                    setLoggedInUser(await CometChat.getLoggedinUser());
                }
                catch(error) {
                    errorHandler(error);
                }
            })();
    }, [errorHandler, setLoggedInUser]);
}
