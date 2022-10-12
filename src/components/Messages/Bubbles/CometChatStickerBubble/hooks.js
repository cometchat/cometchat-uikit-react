import React from "react";

export const Hooks = (props, setStickerURL) => {
  React.useEffect(() => {
    if (props.stickerURL && props.stickerURL.length) {
      setStickerURL(props.stickerURL);
    } else if (props.messageObject) {
      if (
        props.messageObject.data &&
        props.messageObject.data.customData &&
        props.messageObject.data.customData.sticker_url
      ) {
        setStickerURL(props.messageObject.data.customData.sticker_url);
      }
    }
  }, [props.stickerURL, props.messageObject, setStickerURL]);
};
