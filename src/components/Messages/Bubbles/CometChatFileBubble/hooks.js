import React from "react";
import { bytesToSize } from "../../CometChatMessageHelper";
import { MetadataConstants, getMetadataByKey } from "../../..";

export const Hooks = (props, setTitle, setSubTitle, setFileURL) => {
  const getFile = React.useCallback(() => {
    const fileMetadata = getMetadataByKey(
      props.messageObject,
      MetadataConstants.file
    );

    if (fileMetadata instanceof Blob) {
      return fileMetadata;
    } else if (
      props.messageObject.data.hasOwnProperty("attachments") &&
      Array.isArray(props.messageObject.data.attachments) &&
      props.messageObject.data.attachments.length
    ) {
      return { ...props.messageObject.data.attachments[0] };
    }
  }, [props.messageObject]);

  React.useEffect(() => {
    if (props.title && props.title.length) {
      setTitle(props.title);
    } else if (props.messageObject) {
      let fileData = getFile();
      if (fileData) {
        setTitle(fileData.name);
      }
    }
  }, [props.messageObject]);

  React.useEffect(() => {
    if (props.subTitle && props.subTitle.length) {
      setSubTitle(props.subTitle);
    } else if (props.messageObject) {
      let fileData = getFile();
      if (fileData) {
        setSubTitle(bytesToSize(fileData.size));
      }
    }
  }, [props.subTitle, props.messageObject, getFile, setSubTitle]);

  React.useEffect(() => {
    if (props.fileURL && props.fileURL.length) {
      setFileURL(props.fileURL);
    } else if (props.messageObject) {
      const fileData = getFile();
      if (fileData) {
        setFileURL(fileData.url);
      }
    }
  }, [props.fileURL, props.messageObject, getFile, setFileURL]);
};
