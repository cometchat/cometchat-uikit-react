import React from "react";
import { metadataKey, getExtensionsData } from "../../";

export const Hooks = (props, setName, setAvatar, setDocumentURL) => {

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
        if (props.documentURL && props.documentURL.length) {
            setDocumentURL(props.documentURL);
        } else if (props.messageObject) {

            const documentData = getExtensionsData(props.messageObject, metadataKey.extensions.document);
            if (documentData && documentData.document_url && documentData.document_url.trim().length) {
			    setDocumentURL(documentData.document_url);
		    }
        }
    }, [props.documentURL, props.messageObject, setDocumentURL]);
}