import React from "react";
import { getMetadataByKey, MetadataConstants } from "../../../Shared";

export const Hooks = (props, setAudioURL) => {
  const getAudioFile = React.useCallback(() => {
    const fileMetadata = getMetadataByKey(
      props.messageObject,
      MetadataConstants.file
    );
    if (fileMetadata instanceof Blob) {
      return { ...fileMetadata };
    } else if (
      props.messageObject.data.hasOwnProperty("attachments") &&
      Array.isArray(props.messageObject.data.attachments) &&
      props.messageObject.data.attachments.length
    ) {
      return { ...props.messageObject.data.attachments[0] };
    }
  }, [props.messageObject]);
  React.useEffect(() => {
    if (props.audioURL && props.audioURL.length) {
      setAudioURL(props.audioURL);
    } else if (props.messageObject) {
      const audioFileData = getAudioFile();
      if (audioFileData) {
        setAudioURL(audioFileData.url);
      }
    }
  }, [props.audioURL, props.messageObject, getAudioFile, setAudioURL]);
};
