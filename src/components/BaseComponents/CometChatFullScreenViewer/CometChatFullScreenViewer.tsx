import React, { useCallback, useEffect, useState } from 'react';
import { CometChatListItem } from '../CometChatListItem/CometChatListItem';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../../utils/CalendarObject';
import { sanitizeCalendarObject } from '../../../utils/util';

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
    ccCloseClicked,
    message,
    imageSentAtDateTimeFormat
}) => {
    const [image, setImage] = useState<string>();
    const [isDownloading, setIsDownloading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateImage = () => {
            downloadImage(url)
                .then((response) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                     setIsDownloading(false)
                        setImage(img.src);
                    };
                })
                .catch(() => {
                    setImage(url);
                });
        };

        updateImage();
    }, [url, URL]);

    /**
     * Downloads an image with retries in case of failure.
     * @param imgUrl The URL of the image to download.
     * @param attemptCount The current attempt count.
     * @returns A promise that resolves when the image is downloaded.
     */
    const downloadImage = (imgUrl: string, attemptCount: number = 0): Promise<any> => {
        const maxAttempts = 5;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', imgUrl, true);
            xhr.responseType = 'blob';
            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentage = (event.loaded / event.total) * 100;
                    setProgress(percentage);
                }
            };
            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else if (xhr.status === 403 && attemptCount < maxAttempts) {
                        setTimeout(() => {
                            downloadImage(imgUrl, attemptCount + 1)
                                .then(resolve)
                                .catch(reject);
                        }, 800);
                    } else {
                        reject(xhr.statusText);
                    }
                }
            };
            xhr.onerror = () => reject(new Error("There was a network error."));
            xhr.ontimeout = () => reject(new Error("There was a timeout error."));
            xhr.send();
        });
    };

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
                            strokeDasharray: `${(progress / 1.13)} 113`,
                        }}
                    ></circle>
                </svg>
            </div>
        )
    }, [isDownloading, progress])
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