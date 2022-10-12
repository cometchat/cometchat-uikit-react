import whiteBoardIconURL from "../../../Messages/Bubbles/CometChatWhiteboardBubble/resources/collaborative-whiteboard.svg"
class CollaborativeWhiteboardConfiguration{
  constructor({
    style = {},
    iconURL = whiteBoardIconURL
  }) {
    this.style = style;
    this.iconURL = iconURL;
  };
} 
  export { CollaborativeWhiteboardConfiguration };