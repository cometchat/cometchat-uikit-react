import { DeletedBubbleStyle } from "../..";
class DeletedBubbleConfiguration {
  constructor({ style = new DeletedBubbleStyle({}) }) {
    this.style = new DeletedBubbleStyle(style || {});
  }
}
export { DeletedBubbleConfiguration };
