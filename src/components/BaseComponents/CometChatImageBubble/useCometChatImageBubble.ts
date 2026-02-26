import { useState } from "react";

export const useCometChatImageBubble = ({
    src = "",
    placeholderImage = "",
}) => {
    const [image, setImage] = useState<string>(placeholderImage);
    const [timer, setTimer] = useState<NodeJS.Timeout>();

    /* 
        The purpose of this function is to dowwnload the image from the given image url. 
        This function returns a promise which contains image data. 
    */
    const downloadImage = (imgUrl: string, attemptCount: number = 0): Promise<unknown> => {
        const maxAttempts = 5;
        const promise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", imgUrl, true);
            xhr.responseType = "blob";
            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        clearTimeout(timer!); // Clear the timer if the download is successful
                        resolve(xhr.response);
                    } else if (xhr.status === 403 && attemptCount < maxAttempts) {
                        const timerFunction = setTimeout(() => {
                            downloadImage(imgUrl, attemptCount + 1)
                                .then((response) => resolve(response))
                                .catch((error: ErrorEvent) => reject(error));
                        }, 800);
                        setTimer(timerFunction);
                    } else {
                        reject(xhr.statusText);
                    }
                }
            };
            xhr.onerror = (event) => reject(new Error("There was a network error."));
            xhr.ontimeout = (event) => reject(new Error("There was a timeout error."));
            xhr.send();
        });
        return promise;
    }

    /* 
        This function is triggered every time when the image bubble is rendered.
        It triggers the logic for image downloading and setting it. 
    */
    const updateImage: () => void = () => {
        downloadImage(src)
            .then((response) => {
                let img = new Image();
                img.src = src;
                img.onload = () => {
                    setImage(img.src);
                };
            })
            .catch((error) => {
                if (src) {
                    setImage(src);
                }
                else {
                    setImage(placeholderImage);
                }
            });
    }

    return {
        image,
        updateImage,
    }
}