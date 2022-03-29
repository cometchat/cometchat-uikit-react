import React from "react";

export const Hooks = (setImageURL, props) => {
  const generateAvatar = React.useCallback(
    (data) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = 200;
      canvas.height = 200;

      //Draw background
      context.fillStyle = props.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      //Draw text
      context.font = props.nameTextFont;
      context.fillStyle = props.nameTextColor;
      context.strokeStyle = "transparent";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(data, canvas.width / 2, canvas.height / 2);

      return canvas.toDataURL("image/svg");
    },
    [props]
  );

  const fetchImage = React.useCallback(
    (image) => {
      let img = new Image();
      img.src = image;
      img.onload = () => {
        setImageURL(image);
      };
    },
    [setImageURL]
  );

  React.useEffect(() => {
    if (props.image.trim().length) {
      fetchImage(props.image);
    } else if (props.name.trim().length) {
      const char = props.name.trim().substring(0, 1).toUpperCase();
      fetchImage(generateAvatar(char));
    }
  }, [props, generateAvatar, fetchImage]);
};
