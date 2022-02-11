import React from "react";
import { metadataKey, getExtensionsData } from "../../";

export const Hooks = (props, setName, setAvatar, setQuestion, setOptions, setVoteCount) => {

    React.useEffect(() => {
        if (props.userName && props.userName.trim().length) {
            setName(props.userName);
        } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
            setName(props.messageObject.sender.name);
        }
    }, [props.userName, props.messageObject, setName]);

    React.useEffect(() => {
        if (props.avatar && props.avatar.length) {
            setAvatar(props.avatar);
        } else if (props.messageObject && props.messageObject.sender) {
            setAvatar(props.messageObject.sender);
        }
    }, [props.avatar, props.messageObject, setAvatar]);

    React.useEffect(() => {
        if (props.pollQuestion && props.pollQuestion.trim().length) {
            setQuestion(props.pollQuestion);
        } else if (props.messageObject) {
            const pollsData = getExtensionsData(props.messageObject, metadataKey.extensions.polls);
            if (pollsData && pollsData.question && pollsData.question.trim().length) {
                setQuestion(pollsData.question);
            }
        }
    }, [props.pollQuestion, props.messageObject, setQuestion]);

    React.useEffect(() => {
        if (props.pollOptions && props.pollOptions.length) {
            setOptions(props.pollOptions);
        } else if (props.messageObject) {
            const pollsData = getExtensionsData(props.messageObject, metadataKey.extensions.polls);
            if (pollsData 
                && pollsData.results 
                && pollsData.results.options 
                && typeof(pollsData.results.options) === "object" 
                && Object.keys(pollsData.results.options).length) {
                setOptions(pollsData.results.options);
            }
        }
    }, [props.pollOptions, props.messageObject, setOptions]);

    React.useEffect(() => {
        if (props.voteCount && props.voteCount.length) {
            setVoteCount(props.voteCount);
        } else if (props.messageObject) {
            const pollsData = getExtensionsData(props.messageObject, metadataKey.extensions.polls);
            if (pollsData && pollsData.results && pollsData.results.total && pollsData.results.total > 0) {
                setVoteCount(pollsData.results.total);
            }
        }
    }, [props.voteCount, props.messageObject, setVoteCount]);
}