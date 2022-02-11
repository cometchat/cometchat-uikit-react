import React from "react";
import { getMetadataByKey, metadataKey } from "../";

export const Hooks = (props, setName, setAvatar, setVideoURL) => {

    const getVideoFile = React.useCallback(() => {

		const fileMetadata = getMetadataByKey(props.messageObject, metadataKey.file);
		
		if (fileMetadata instanceof Blob) {

			return { fileName: fileMetadata["name"] };

		} else if (props.messageObject.data.hasOwnProperty("attachments") 
        && Array.isArray(props.messageObject.data.attachments) 
        && props.messageObject.data.attachments.length) {

			// const fileName = props.messageObject.data.attachments[0]?.name;
			// const fileUrl = props.messageObject.data.attachments[0]?.url;

            // return { fileName, fileUrl: fileUrl };
            return { ...props.messageObject.data.attachments[0] };
		}

	}, [props.messageObject]);

    React.useEffect(() => {
		if (props.userName && props.userName.length) {
			setName(props.userName);
		} else if (props.messageObject 
			&& props.messageObject.sender 
			&& props.messageObject.sender.name) {
			setName(props.messageObject.sender.name);
		}
	}, [props.userName, props.messageObject, setName]);

	React.useEffect(() => {
		if (props.avatar && props.avatar.length) {
			//avatarSource.current = "url";
			setAvatar(props.avatar);
		} else if (props.messageObject && props.messageObject.sender) {
			//avatarSource.current = "user";
			setAvatar(props.messageObject.sender);
		}
	}, [props.avatar, props.messageObject, setAvatar]);

    React.useEffect(() => {
        if (props.videoURL && props.videoURL.length) {
            setVideoURL(props.videoURL);
        } else if (props.messageObject) {

			const videoFileData = getVideoFile();
			if (videoFileData) {
				getVideoFile(videoFileData.url);
			}
        }
    }, [props.videoURL, props.messageObject, getVideoFile, setVideoURL]);
}