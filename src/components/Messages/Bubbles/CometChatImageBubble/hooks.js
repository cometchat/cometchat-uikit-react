import React from "react";

import {
  ExtensionConstants,
  getExtensionsData,
  MetadataConstants,
} from "../../../Shared";
import { CometChatMessageEvents } from "../../";

export const Hooks = (props, setImageURL, imageURL, setUnsafe) => {
  const pickImage = (thumbnailGenerationObject) => {
    const mediumUrl = thumbnailGenerationObject["url_medium"];
    return mediumUrl;
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
                .then((response) => resolve(imgUrl))
                .catch((error) => reject(error));
            }, 800);
          }
        } else {
          reject(xhr.statusText);
        }
      };

      xhr.onerror = (event) =>
        reject(new Error("There was a network error.", event));
      xhr.ontimeout = (event) =>
        reject(new Error("There was a timeout error.", event));
      xhr.send();
    });
  };

  const setMessageImageUrl = React.useCallback(() => {
    return new Promise((resolve) => {
      let img = new Image();

      if (
        props.messageObject &&
        props.messageObject.data &&
        props.messageObject.data.attachments &&
        typeof props.messageObject.data.attachments === "object" &&
        props.messageObject.data.attachments.length
      ) {
        img.src = props.messageObject.data.attachments[0]?.url;
      } else if (
        props.messageObject.data.file &&
        props.messageObject.data.file
      ) {
        const reader = new FileReader();
        reader.onload = function () {
          img.src = reader.result;
        };

        reader.readAsDataURL(props.messageObject.data.file);
      }

      img.onload = () => resolve(img.src);
    });
  }, [props.messageObject]);

  React.useEffect(() => {
    if (props.imageURL && props.imageURL.length) {
      setImageURL(props.imageURL);
    } else if (props.messageObject) {
      const thumbnailGenerationExtensionData = getExtensionsData(
        props.messageObject,
        MetadataConstants.extensions.thumbnailGeneration
      );
      if (
        thumbnailGenerationExtensionData &&
        !thumbnailGenerationExtensionData.hasOwnProperty("error")
      ) {
        const imageToDownload = pickImage(thumbnailGenerationExtensionData);

        downloadImage(imageToDownload)
          .then((response) => {
            let img = new Image();
            img.src = imageToDownload;
            img.onload = () => setImageURL(img.src);
          })
          .catch((error) => {
            CometChatMessageEvents.emit(
              CometChatMessageEvents.onMessageError,
              error
            );
          });
      } else {
        setMessageImageUrl().then((imageUrl) => {
          if (imageUrl !== imageURL) {
            setImageURL(imageUrl);
          }
        });
      }
    }

    /**image moderation extension */
    const imageModeration = getExtensionsData(
      props?.messageObject,
      ExtensionConstants.imageModeration
    );

    if (imageModeration?.["unsafe"] === "yes") {
      setUnsafe(true);
    } else {
      setUnsafe(false);
    }
  }, [
    props,
    imageURL,
    props.imageURL,
    props.messageObject,
    setImageURL,
    setMessageImageUrl,
  ]);
};
