import collaborativeIconURL from "./resources/collaborative-document.svg"
class CollaborativeDocumentConfiguration {
  constructor({
    style = {},
    iconURL = collaborativeIconURL
  }) {
    this.style = style;
    this.iconURL = iconURL;
  };
} 
  export { CollaborativeDocumentConfiguration };