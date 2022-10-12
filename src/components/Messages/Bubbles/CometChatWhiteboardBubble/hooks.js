import React from "react";
import { getExtensionsData, MetadataConstants } from "../../..";

export const Hooks = (props, setWhiteboardURL) => {
  React.useEffect(() => {
    if (props?.whiteboardURL && props.whiteboardURL?.length) {
      setWhiteboardURL(props?.whiteboardURL);
    } else if (props?.messageObject) {
      const whiteboardData = getExtensionsData(
        props?.messageObject,
        MetadataConstants.extensions?.whiteboard
      );
      if (
        whiteboardData &&
        whiteboardData.board_url &&
        whiteboardData.board_url.trim().length
      ) {
        // Appending the username to the board_url
        const username = props.loggedInUser?.name.split(" ").join("_");
        setWhiteboardURL(whiteboardData.board_url + "&username=" + username);
      }
    }
  }, [
    props.whiteboardURL,
    props.messageObject,
    props.loggedInUser,
    setWhiteboardURL,
  ]);
};
