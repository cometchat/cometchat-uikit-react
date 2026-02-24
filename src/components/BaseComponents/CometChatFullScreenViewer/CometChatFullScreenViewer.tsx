import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChatListItem } from '../CometChatListItem/CometChatListItem';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../../utils/CalendarObject';
import { sanitizeCalendarObject } from '../../../utils/util';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import placeholderIcon from "../../../assets/image_placeholder.png";
import { requiresSecureMediaAccess, resolveSecureUrl } from "../../../utils/useSecureMedia";

/**
 * Props for the CometChatFullScreenViewer component.
 */
interface FullScreenViewerProps {
    /**
     * URL of the image to be displayed 
     */
    url?: string;

    /** Placeholder image URL */
    placeholderImage?: string;

    /** Callback function when the close button is clicked */
    ccCloseClicked?: () => void;

    /**
     * The media message containing the image.
     */
    message: CometChat.BaseMessage;

    /**
     * Format for timestamps associated with images in the message list.
     */
    imageSentAtDateTimeFormat?:CalendarObject
}

/**
 * CometChatFullScreenViewer is a full-screen image viewer component with a customizable close button.
 * 
 * @param {FullScreenViewerProps} props - The properties passed to the component.
 */
const CometChatFullScreenViewer: React.FC<FullScreenViewerProps> = ({
    url = "",
    placeholderImage = placeholderIcon,
    ccCloseClicked,
    message,
    imageSentAtDateTimeFormat
}) => {
    const [image, setImage] = useState<string>(placeholderImage);
    const [isDownloading, setIsDownloading] = useState(true);
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        let cancelled = false;
        setProgress(0);

        const loadImage = async () => {
            if (!url) {
                setImage(placeholderImage);
                setIsDownloading(false);
                return;
            }

            if (requiresSecureMediaAccess(url)) {
                try {
                    abortControllerRef.current = new AbortController();
                    const { signal } = abortControllerRef.current;

                    const signedUrl = await resolveSecureUrl(url);
                    if (cancelled) return;

                    if (!signedUrl) {
                        setImage(placeholderImage);
                        setIsDownloading(false);
                        return;
                    }

                    const response = await fetch(signedUrl, { signal });
                    if (!response.body) {
                        if (!cancelled) {
                            setImage(signedUrl);
                            setIsDownloading(false);
                        }
                        return;
                    }

                    const reader = response.body.getReader();
                    const contentLength = +(response.headers.get('Content-Length') ?? 0);
                    let receivedLength = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        receivedLength += value.length;
                        if (contentLength > 0 && !cancelled) {
                            setProgress(Math.floor((receivedLength / contentLength) * 100));
                        }
                    }

                    if (!cancelled) {
                        setImage(signedUrl);
                        setIsDownloading(false);
                    }
                } catch {
                    if (!cancelled) {
                        setImage(placeholderImage);
                        setIsDownloading(false);
                    }
                }
            } else {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    if (!cancelled) {
                        setIsDownloading(false);
                        setImage(url);
                    }
                };
                img.onerror = () => {
                    if (!cancelled) {
                        setIsDownloading(false);
                        setImage(placeholderImage);
                    }
                };
            }
        };

        loadImage();

        return () => {
            cancelled = true;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [url, placeholderImage]);

    /**
     * Handles the close button click event.
     */
    const handleCloseClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        if (ccCloseClicked) {
            ccCloseClicked();
        }
    };

     /**
     * Default progress bar view.
      */
     const getProgressBar = useCallback(() => {
        return (
            <div
            className="cometchat-fullscreen-viewer__body-download-progress"
            >
                <svg>
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="cometchat-fullscreen-viewer__body-download-progress-background"
                    ></circle>
                    <circle
                        className="cometchat-fullscreen-viewer__body-download-progress-foreground"
                        cx="50"
                        cy="50"
                        r="40"
                        style={{
                            strokeDasharray: `${(progress / 100) * 251.33} 251.33`,
                        }}
                    ></circle>
                </svg>
            </div>
        )
    }, [progress]);

   /**
   * Function for timestamps associated with images in the message list.
   * @returns CalendarObject
   */
    function getDateFormat():CalendarObject{
        const defaultFormat = {
            yesterday: ` DD/M/YYYY [${getLocalizedString("full_screen_viewer_at")}] hh:mm A`,
            otherDays: ` DD/M/YYYY [${getLocalizedString("full_screen_viewer_at")}] hh:mm A`,
            today:` DD/M/YYYY [${getLocalizedString("full_screen_viewer_at")}] hh:mm A`
          };
        var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
        var componentCalendarFormat = sanitizeCalendarObject(imageSentAtDateTimeFormat)

          const finalFormat = {
            ...defaultFormat,
            ...globalCalendarFormat,
            ...componentCalendarFormat
          };
          return finalFormat;
      }

    return (
        <div className="cometchat">
            <div className="cometchat-fullscreen-viewer">
                <div className="cometchat-fullscreen-viewer__header">
                    <div className='cometchat-fullscreen-viewer__header-item'>
                        <CometChatListItem
                            avatarName={message?.getSender()?.getName()}
                            avatarURL={message?.getSender()?.getAvatar()}
                            title={message?.getSender()?.getName()}
                            subtitleView={
                                `${CometChatLocalize.formatDate(message?.getSentAt(),getDateFormat())}`}
                        />
                    </div>
                </div>
                <div className="cometchat-fullscreen-viewer__body">
                 { isDownloading ?  getProgressBar(): <img
                        src={image}
                        className="cometchat-fullscreen-viewer__body-image"
                        alt={getLocalizedString("message_list_full_screen_viewer")}
                        onError={() => setImage(placeholderImage)}
                    />}
                </div>

                <button
                    className="cometchat-fullscreen-viewer__close-button"
                    onClick={handleCloseClick}
                />
            </div>
        </div>
    );
};

export { CometChatFullScreenViewer };