import { useState, useRef, useEffect, useId } from "react";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatButton } from "../CometChatButton/CometChatButton";

interface ConfirmDialogProps {
    /** The title displayed at the top of the confirm dialog. */
    title?: string;
    /** The descriptive text inside the confirm dialog. */
    messageText?: string;
    /** The text displayed on the "cancel" button. */
    cancelButtonText?: string;
    /** The text displayed on the "confirm" button. */
    confirmButtonText?: string;
    /** Callback function for when the confirm button is clicked. */
    onSubmitClick?: () => Promise<void>;

    /** Callback function for when the cancel button is clicked. */
    onCancelClick?: () => void;
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
    CometChatConfirmDialog is a dialog component that includes a title, description, and action buttons.
    It can be used for displaying warning, alert, and info popups.
    It accepts 'title' and 'messageText' props to show as the title and description of the modal.
    The 'confirmButtonText' and 'cancelButtonText' props are used to name the action buttons. Also it accepts callbacks "onSubmitClick", "onCancelClick" to be triggered on confirm and cancel buttons click.
*/
const CometChatConfirmDialog = (props: ConfirmDialogProps) => {
    const {
        title = getLocalizedString("conversation_delete_title"),
        messageText = getLocalizedString("conversation_delete_subtitle"),
        cancelButtonText = getLocalizedString('conversation_delete_confirm_no'),
        confirmButtonText = getLocalizedString("conversation_delete_confirm_yes"),
        onSubmitClick,
        onCancelClick,
    } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const dialogId = useId();
    const titleId = `${dialogId}-title`;
    const descId = `${dialogId}-desc`;
    const errorId = `${dialogId}-error`;

    // Focus first button when dialog opens
    useEffect(() => {
        requestAnimationFrame(() => {
            const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            first?.focus();
        });
    }, []);

    // Handle keyboard: Escape to cancel, Tab for focus trap
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !isLoading && onCancelClick) {
            e.preventDefault();
            onCancelClick();
            return;
        }

        if (e.key !== "Tab") return;

        const focusable = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
        );
        if (focusable.length === 0) { e.preventDefault(); return; }

        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

        e.preventDefault();

        if (e.shiftKey) {
            focusable[currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1].focus();
        } else {
            focusable[currentIndex === -1 || currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1].focus();
        }
    };

    const handleSubmitClick = ()=>{
if(onSubmitClick){
    setIsLoading(true);
    setIsError(false);
    onSubmitClick().then(()=>{
    }).then(() => {
        setIsLoading(false);
        setIsError(false);
        if(onCancelClick){
            onCancelClick()
        }
    })
    .catch((error) => {
        setIsError(true);
        setIsLoading(false);
    });
}
    }

    return (
        <div 
            className="cometchat" 
            style={{width:"fit-content" , height:"fit-content"}}
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={isError ? `${descId} ${errorId}` : descId}
            onKeyDown={handleKeyDown}
        >
            {isError ? (
                <div 
                    id={errorId}
                    className="cometchat-dialog-error-view cometchat-confirm-dialog-error-view"
                    role="alert"
                    aria-live="assertive"
                >
                    {getLocalizedString("conversation_delete_error")}
                </div>
            ) : null}
            <div className="cometchat-confirm-dialog">
                <div className="cometchat-confirm-dialog__icon-wrapper" aria-hidden="true">
                    <div className="cometchat-confirm-dialog__icon-wrapper-icon"></div>
                </div>
                <div className="cometchat-confirm-dialog__content">
                    <div id={titleId} className="cometchat-confirm-dialog__content-title">
                        {title}
                    </div>
                    <div id={descId} className="cometchat-confirm-dialog__content-description">
                        {messageText}
                    </div>
                </div>
                <div className="cometchat-confirm-dialog__button-group" role="group" aria-label={getLocalizedString("actions") || "Actions"}>
                    <div className="cometchat-confirm-dialog__button-group-cancel">
                        <CometChatButton 
                            onClick={onCancelClick} 
                            text={cancelButtonText}
                            ariaLabel={cancelButtonText || getLocalizedString("cancel")}
                        />
                    </div>
                    <div className="cometchat-confirm-dialog__button-group-submit">
                        <CometChatButton 
                            isLoading={isLoading} 
                            onClick={handleSubmitClick} 
                            text={confirmButtonText}
                            ariaLabel={isLoading ? getLocalizedString("loading") || "Loading" : confirmButtonText || getLocalizedString("confirm")}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { CometChatConfirmDialog };