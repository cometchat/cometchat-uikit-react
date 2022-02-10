import React from "react";

import { getExtensionsData, metadataKey } from "../";

export const Hooks = (props, setName, setAvatar, setImageURL, imageURL) => {

    const pickImage = thumbnailGenerationObject => {
        const smallUrl = thumbnailGenerationObject["url_small"];
        const mediumUrl = thumbnailGenerationObject["url_medium"];

        const mq = window.matchMedia("(min-width: 320px) and (max-width: 767px)");

        let imageToDownload = mediumUrl;
        if (mq.matches) {
            imageToDownload = smallUrl;
        }

        return imageToDownload;
    };

    const downloadImage = (imgUrl) => {

        return new Promise((resolve, reject) => {

            let timer;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", imgUrl, true);
            xhr.responseType = "blob";

            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        timer = null;
                        resolve(imgUrl);
                    } else if (xhr.status === 403) {
                        timer = setTimeout(() => {
                            downloadImage(imgUrl)
                                .then(response => resolve(imgUrl))
                                .catch(error => reject(error));
                        }, 800);
                    }
                } else {
                    reject(xhr.statusText);
                }
            };

            xhr.onerror = event => reject(new Error("There was a network error.", event));
            xhr.ontimeout = event => reject(new Error("There was a timeout error.", event));
            xhr.send();
        });
    };


    const setMessageImageUrl = React.useCallback(() => {

        return new Promise(resolve => {

            let img = new Image();

            if (props.messageObject 
                && props.messageObject.data 
                && props.messageObject.data.attachments 
                && typeof props.messageObject.data.attachments  === "object"
                && props.messageObject.data.attachments.length) {

                img.src = props.messageObject.data.attachments[0]?.url;
            } else if (props.messageObject.data.file && props.messageObject.data.file) {
                const reader = new FileReader();
                reader.onload = function () {
                    img.src = reader.result;
                };

                reader.readAsDataURL(props.messageObject.data.file);
            }

            img.onload = () => resolve(img.src);
        });

    }, [props.messageObject])

    React.useEffect(() => {
		if (props.userName && props.userName.length) {
			setName(props.userName);
		} else if (props.messageObject 
			&& props.messageObject.sender 
			&& props.messageObject.sender.name) {
			setName(props.messageObject.sender.name);
		}
	}, [props.userName, props.messageObject, setName]);

	React.useEffect(() => {
		if (props.avatar && props.avatar.length) {
			setAvatar(props.avatar);
		} else if (props.messageObject && props.messageObject.sender) {
			setAvatar(props.messageObject.sender);
		}
	}, [props.avatar, props.messageObject, setAvatar]);

    React.useEffect(() => {
        if (props.imageURL && props.imageURL.length) {
            setImageURL(props.imageURL);
        } else if (props.messageObject) {

            const thumbnailGenerationExtensionData = getExtensionsData(props.messageObject, metadataKey.extensions.thumbnailGeneration);
            if (thumbnailGenerationExtensionData && !thumbnailGenerationExtensionData.hasOwnProperty("error")) {
                const mq = window.matchMedia("(min-width: 320px) and (max-width: 767px)");
                mq.addListener(() => {
                    const imageToDownload = pickImage(thumbnailGenerationExtensionData);
                    let img = new Image();
                    img.src = imageToDownload;
                    img.onload = () => setImageURL(img.src);
                });

                const imageToDownload = pickImage(thumbnailGenerationExtensionData);
                
                downloadImage(imageToDownload)
                    .then(response => {
                        let img = new Image();
                        img.src = imageToDownload;
                        img.onload = () => setImageURL(img.src);
                    })
                    .catch(error => console.error(error));
            } else {
                setMessageImageUrl().then(imageUrl => {

                    if(imageUrl !== imageURL) {
                        setImageURL(imageUrl);
                    }
                });
            }
        }
    }, [imageURL, props.imageURL, props.messageObject, setImageURL, setMessageImageUrl]);
}