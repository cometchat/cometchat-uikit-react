import React from "react";
import { getExtensionsData, MetadataConstants } from "../../..";

export const Hooks = (props, setDocumentURL) => {
  React.useEffect(() => {
    if (props.documentURL && props.documentURL.length) {
      setDocumentURL(props.documentURL);
    } else if (props.messageObject) {
      const documentData = getExtensionsData(
        props.messageObject,
        MetadataConstants.extensions.document
      );
      if (
        documentData &&
        documentData.document_url &&
        documentData.document_url.trim().length
      ) {
        setDocumentURL(documentData.document_url);
      }
    }
  }, [props.documentURL, props.messageObject, setDocumentURL]);
};
