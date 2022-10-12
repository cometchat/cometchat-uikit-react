import React from "react";
import { getMetadataByKey, MetadataConstants } from "../../..";

export const Hooks = (props, setVideoURL) => {
  const getVideoFile = React.useCallback(() => {
    const fileMetadata = getMetadataByKey(
      props.messageObject,
      MetadataConstants.file
    );

    if (fileMetadata instanceof Blob) {
      return { fileName: fileMetadata["name"] };
    } else if (
      props.messageObject.data.hasOwnProperty("attachments") &&
      Array.isArray(props.messageObject.data.attachments) &&
      props.messageObject.data.attachments.length
    ) {
      // const fileName = props.messageObject.data.attachments[0]?.name;
      // const fileUrl = props.messageObject.data.attachments[0]?.url;

      // return { fileName, fileUrl: fileUrl };
      return { ...props.messageObject.data.attachments[0] };
    }
  }, [props.messageObject]);

  React.useEffect(() => {
    if (props.videoURL && props.videoURL.length) {
      setVideoURL(props.videoURL);
    } else if (props.messageObject) {
      const videoFileData = getVideoFile();
      if (videoFileData) {
        setVideoURL(videoFileData.url);
      }
    }
  }, [props.videoURL, props.messageObject, getVideoFile, setVideoURL]);
};
