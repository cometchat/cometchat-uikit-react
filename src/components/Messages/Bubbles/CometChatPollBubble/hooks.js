import React from "react";
import { getExtensionsData, MetadataConstants } from "../../..";

export const Hooks = (
  props,
  setQuestion,
  setOptions,
  setVoteCount,
  setPollId
) => {
  React.useEffect(() => {
    if (props?.pollQuestion && props?.pollQuestion?.trim()?.length) {
      setQuestion(props.pollQuestion);
    } else if (props?.messageObject) {
      const pollsData = getExtensionsData(
        props.messageObject,
        MetadataConstants.extensions.polls
      );
      if (pollsData && pollsData.question && pollsData.question.trim().length) {
        setQuestion(pollsData.question);
      }
    }
  }, [props.pollQuestion, props.messageObject, setQuestion]);

  React.useEffect(() => {
    if (props.options && props.options.length) {
      setOptions(props.pollOptions);
    } else if (props.messageObject) {
      const pollsData = getExtensionsData(
        props.messageObject,
        MetadataConstants.extensions.polls
      );
      if (
        pollsData &&
        pollsData.results &&
        pollsData.results.options &&
        typeof pollsData.results.options === "object" &&
        Object.keys(pollsData.results.options).length
      ) {
        setOptions(pollsData.results.options);
      }
    }
  }, [props.pollOptions, props.messageObject, setOptions, props.options]);

  React.useEffect(() => {
    if (props.totalVoteCount && props.totalVoteCount.length) {
      setVoteCount(props.totalVoteCount);
    } else if (props.messageObject) {
      const pollsData = getExtensionsData(
        props.messageObject,
        MetadataConstants.extensions.polls
      );
      setPollId(pollsData.id);
      if (
        pollsData &&
        pollsData.results &&
        pollsData.results.total &&
        pollsData.results.total > 0
      ) {
        setVoteCount(pollsData.results.total);
      }
    }
  }, [props.totalVoteCount, props.messageObject, setVoteCount, setPollId]);
};
