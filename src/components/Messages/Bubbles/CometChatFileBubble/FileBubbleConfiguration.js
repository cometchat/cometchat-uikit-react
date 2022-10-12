import fileIconURL from "../../../Messages/Bubbles/CometChatFileBubble/resources/file-upload.svg"
class FileBubbleConfiguration {
  constructor({
    style = {},
    iconURL = fileIconURL
  }) {
    this.style = style;
    this.iconURL = iconURL;
  };
} 
  
  export { FileBubbleConfiguration };