import React from "react";
import { getExtensionsData, MetadataConstants } from "../..";

export const Hooks = (
  messageObject,
  reactionRef,
  reactionView,
  setReactionList
) => {
  React.useEffect(() => {
    reactionRef.current = getExtensionsData(
      messageObject,
      MetadataConstants.extensions.reactions
    );

    let isEmpty = false;

    if (reactionRef.current) {
      const messageReactions = Object.keys(reactionRef.current).map((data) => {
        let reactionData;

        if (Object.keys(reactionRef.current[data]).length) {
          isEmpty = true;
          reactionData = reactionRef.current[data];
          return reactionView({ [data]: reactionData }, reactionData);
        } else {
          isEmpty = false;
        }
      });
      if (isEmpty) {
        setReactionList(messageReactions);
      }
    }
  }, [messageObject]);

  React.useEffect(() => {}, []);
};
