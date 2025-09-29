import { FC, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CometChatTextFormatter } from '../../../formatters';

/**
 * Interface for the props used in the CometChatMessagePreview component.
 */
interface CometChatMessagePreviewProps {
    /** The title to display in the preview, defaults to "Edit Message"*/
    previewTitle?: JSX.Element | null;
    /** To hide the close icon in the preview */
    hideCloseButton?: boolean;
    /** The subtitle to display in the preview, can be left empty. */
    previewSubtitle?: JSX.Element | null;
    /** Callback function that triggers when the close button is clicked. */
    onClose?: () => void;
    /** Message object replying to */
    message?: CometChat.BaseMessage;
    /** Moderation status of the message that is being replied */
    isMessageModerated?: boolean;
    /** Text formatters for message bubble */
    textFormatters?: CometChatTextFormatter[];
}

/**
 * CometChatMessagePreview Component
 *
 * A React component that displays a preview of a message that is being replied with a title and subtitle.
 * @param {CometChatMessagePreviewProps} props - The props for the component.
 * @returns {JSX.Element} A JSX element displaying the edit preview UI.
 */
const CometChatMessagePreview: FC<CometChatMessagePreviewProps> = ({
    previewTitle,
    hideCloseButton = false,
    previewSubtitle,
    onClose,
    message,
    isMessageModerated = false,
    textFormatters = []
}: CometChatMessagePreviewProps): JSX.Element => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const observerRef = useRef<ResizeObserver | null>(null);

    // Optimize ResizeObserver setup
    useEffect(() => {
        if (!hideCloseButton || !elementRef.current) {
            return;
        }

        const parentNode = elementRef.current.closest('.cometchat-message-bubble__body-reply-view')?.parentNode;
        if (!parentNode) return;

        const contentNode = parentNode.querySelector('.cometchat-message-bubble__body-content-view') as HTMLElement | null;
        if (!contentNode) return;

        // Clean up existing observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Setup new observer
        observerRef.current = new ResizeObserver(entries => {
            for (const entry of entries) {
                const newWidth = entry.contentRect.width;
                setWidth(prev => prev !== newWidth ? newWidth : prev);
            }
        });

        observerRef.current.observe(contentNode);
        setWidth(contentNode.offsetWidth);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [hideCloseButton]);

    // Memoize style object
    const containerStyle = useMemo(() => ({
        maxWidth: (hideCloseButton) ? width <= 100 ? 105 : width : '100%',
        width: '100%',
    }), [hideCloseButton, width]);

    // Optimize close handler
    const handleClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    return (
        <div
            key={"cometchat-message-preview"+ message?.getId()}
            ref={elementRef}
            className={`cometchat ${hideCloseButton ? 'bubble-view' : 'composer-view'}`}
            style={isMessageModerated ? width < 240 ? { width: `calc(${240}px - var(--cometchat-padding-1) * 2)` } : containerStyle : containerStyle}
        >
            <div className="cometchat-message-preview">
                <div className="cometchat-message-preview__title">{previewTitle}</div>
                {!message?.getDeletedAt() ? <>
                   {previewSubtitle}
                    {!hideCloseButton && (
                        <div
                            className="cometchat-message-preview__close"
                            onClick={handleClose}
                        />
                    )}
                </> : <div className='cometchat-message-preview-deleted__message'>
                    <div className='cometchat-message-preview-deleted__message__icon'></div>
                    <div className='cometchat-message-preview-deleted__message__text'>
                    {getLocalizedString("message_deleted")}
                    </div>
                </div>}
            </div>
        </div>
    );
};

export { CometChatMessagePreview };