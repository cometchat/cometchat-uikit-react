/**
 * @class ConversationListStyle
 * @description ConversationListStyle class is used for defining the styles for conversation list.
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} loadingIconTint
 * @param {String} emptyStateTextFont
 * @param {String} emptyStateTextColor
 * @param {String} errorStateTextFont
 * @param {String} errorStateTextColor
 */

 class ConversationListStyle {
    constructor({
      width = "100%",
      height = "100%",
      background = "",
      border = "",
      borderRadius = "0",
      loadingIconTint = "",
      emptyStateTextFont = "",
      emptyStateTextColor = "",
      errorStateTextFont = "",
      errorStateTextColor = "",
    }) {
      this.width = width;
      this.height = height;
      this.background = background;
      this.border = border;
      this.borderRadius = borderRadius;
      this.loadingIconTint = loadingIconTint;
      this.emptyStateTextFont = emptyStateTextFont;
      this.emptyStateTextColor = emptyStateTextColor;
      this.errorStateTextFont = errorStateTextFont;
      this.errorStateTextColor = errorStateTextColor;
    }
  }
  export { ConversationListStyle };
  