import { useCallback, useRef, useState } from "react";
import filetype from '../../../assets/file_type_unsupported.png'
import { resolveSecureUrl } from "../../../utils/useSecureMedia";

interface FileBubbleProps {
    /* url of the file present in the message. */
    fileURL: string;
    /* url of the icon used for showing file type. */
    fileTypeIconURL?: string;
    /* title of the file bubble. */
    title?: string;
    /* description of the file present. */
    subtitle?: string;
    /* boolean to toggle bubble styling */
    isSentByMe?: boolean;
}

/* 
    CometChatFileBubble is a composite component used to display file messages. 
    It is generally used in user or group chats as a wrapper for file messages. It accepts 'fileURL' for the file's URL, and 'title' and 'subtitle' for the file message. 
    It also accepts 'downloadIconURL,' which is the URL of the download icon, for customization purposes.
*/
const CometChatFileBubble = (props: FileBubbleProps) => {
    const {
        fileURL = "",
        fileTypeIconURL,
        title,
        subtitle,
        isSentByMe = true
    } = props;

    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Function to download the file and show download progress bar
     */
    const downloadFile = async () => {
        const url = fileURL;
        setIsDownloading(true);
        setHasError(false);
        try {
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            let downloadUrl = await resolveSecureUrl(url);

            const response = await fetch(downloadUrl, { signal });

            if (!response.body) {
                throw new Error('ReadableStream not yet supported in this browser.');
            }
            const reader = response.body.getReader();
            const contentLength = +(response.headers.get('Content-Length') ?? 0);
            let receivedLength = 0;
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(value);
                receivedLength += value.length;
                if (contentLength > 0) {
                    setProgress(Math.floor((receivedLength / contentLength) * 100));
                }
            }
            setIsDownloading(false);
            const blob = new Blob(chunks);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = title ?? "File";
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Download was aborted');
            } else {
                console.error('Download failed:', error);
                setHasError(true);
            }
            setIsDownloading(false);
            setProgress(0);
        }
    };

    /**
     * Function to stop the download
      */
    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsDownloading(false);
            setProgress(0);
        }
    };
    /**
     * Default progress bar view.
      */
    const getProgressBar = useCallback(() => {
        return (
            <div className="cometchat-file-bubble__tail-view-download-progress
">
                <svg>
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        className="cometchat-file-bubble__tail-view-download-progress-background"

                    ></circle>
                    <circle
                        className="cometchat-file-bubble__tail-view-download-progress-foreground"
                        cx="10"
                        cy="10"
                        r="8"
                        style={{
                            strokeDasharray: `${progress * 1.13} 113`,
                        }}
                    ></circle>
                </svg>
                <div className="cometchat-file-bubble__tail-view-download-stop" onClick={cancelDownload}></div>
            </div>
        )
    }, [isDownloading, progress])


    return (
        <div className="cometchat">
            <div className={`cometchat-file-bubble ${isSentByMe ? "cometchat-file-bubble-outgoing" : "cometchat-file-bubble-incoming"}`}>
               <div>
               <img src={fileTypeIconURL ?? filetype} className="cometchat-file-bubble__leading-view"></img>
                <div className="cometchat-file-bubble__body
        ">
                    <div className="cometchat-file-bubble__body-name">
                        {title}
                    </div>
                    <div className="cometchat-file-bubble__body-details"> {subtitle} </div>
                </div>
               </div>

                <div className="cometchat-file-bubble__tail-view">
                    {isDownloading ? getProgressBar() : <div className="cometchat-file-bubble__tail-view-download" onClick={downloadFile} ></div>}
                </div>
            </div >
        </div>
    )
}

export { CometChatFileBubble };