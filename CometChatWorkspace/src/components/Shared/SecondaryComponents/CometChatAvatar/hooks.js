import React from "react";

export const Hooks = (setImageURL, props) => {

    const generateAvatar = React.useCallback(() => data => {

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = 200;
        canvas.height = 200;

        //Draw background
        context.fillStyle = props.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        //Draw text
        context.font = props.textFont;
        context.fillStyle = props.textColor;
        context.strokeStyle = "transparent";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(data, canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL("image/svg");

    }, [props]);

    const fetchImage = React.useCallback(image => {
        let img = new Image();
        img.src = image;
        img.onload = () => {
            setImageURL(image);
        };
    }, [setImageURL]);

    React.useEffect(() => {
        if (props.image.trim().length) {
            fetchImage(props.image);
        } else if (props.user && Object.keys(props.user).length) {
            if (props.user.avatar) {
                fetchImage(props.user.avatar);
            } else {
                const char = props.user.name.substring(0, 2).toUpperCase();
                fetchImage(generateAvatar(char));
            }
        } else if (props.group && Object.keys(props.group).length) {
            if (props.group.icon) {
                fetchImage(props.group.icon);
            } else {
                const char = props.group.name.substring(0, 2).toUpperCase();
                fetchImage(generateAvatar(char));
            }
        }
    }, [props, generateAvatar, fetchImage]);
}