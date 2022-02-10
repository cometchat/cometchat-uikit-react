import React from "react";
import { getMetadataByKey, metadataKey } from "../";
import { bytesToSize } from "../CometChatMessageHelper";

export const Hooks = (props, setName, setAvatar, setTitle, setSubTitle, setAudioURL) => {

    const getAudioFile = React.useCallback(() => {

        const fileMetadata = getMetadataByKey(props.messageObject, metadataKey.file);
        if (fileMetadata instanceof Blob) {

            return { ...fileMetadata };
            //return { name: fileMetadata.name, url: fileMetadata.name };

        } else if (props.messageObject.data.hasOwnProperty("attachments") 
        && Array.isArray(props.messageObject.data.attachments) 
        && props.messageObject.data.attachments.length) {

            return { ...props.messageObject.data.attachments[0] };
        }

    }, [props.messageObject]);

    React.useEffect(() => {
        if (props.userName && props.userName.length) {
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
			if (props.title && props.title.length) {
				setTitle(props.title);
			} else if (props.messageObject) {
				const audioFileData = getAudioFile();
				if (audioFileData) {
					setTitle(audioFileData.name);
				}
			}
		}, [props.title, props.messageObject, setTitle, getAudioFile]);

    React.useEffect(() => {

        if (props.subTitle && props.subTitle.length) {
            setSubTitle(props.subTitle);
        } else if (props.messageObject) {

            const audioFileData = getAudioFile();
            if (audioFileData) {
                setSubTitle(bytesToSize(audioFileData.size));
            }
        }
    }, [props.subTitle, props.messageObject, setSubTitle, getAudioFile]);

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
}