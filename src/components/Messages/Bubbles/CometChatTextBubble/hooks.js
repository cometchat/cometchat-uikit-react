import React from "react";
import { MetadataConstants, getExtensionsData } from "../../../Shared";

export const Hooks = (props, setLinkPreview) => {
  React.useEffect(() => {
    const linkPreviewData = getExtensionsData(
      props.messageObject,

      MetadataConstants.extensions.linkPreview
    );
    setLinkPreview(linkPreviewData);
  }, [props, setLinkPreview]);
};
