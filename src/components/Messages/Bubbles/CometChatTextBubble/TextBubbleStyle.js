import { BaseStyles } from "../../../Shared";

/**
 * @class TextBubbleStyle
 * @description TextBubbleStyle is used to defining text bubble style
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} textFont
 * @param {string} textColor
 * @param {string} linkPreviewTitleColor
 * @param {string} linkPreviewTitleFont
 * @param {string} linkPreviewSubtitleColor
 * @param {string} linkPreviewSubtitleFont
 * @param {string} textBubbleBackgroundColor
 */

class TextBubbleStyle extends BaseStyles {
  constructor({
    width = "auto",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "8px",

    textFont = "",
    textColor = "",
    linkPreviewTitleColor = "",
    linkPreviewTitleFont = "",
    linkPreviewSubtitleColor = "",
    linkPreviewSubtitleFont = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });
    this.textFont = textFont;
    this.textColor = textColor;
    this.linkPreviewTitleColor = linkPreviewTitleColor;
    this.linkPreviewTitleFont = linkPreviewTitleFont;
    this.linkPreviewSubtitleColor = linkPreviewSubtitleColor;
    this.linkPreviewSubtitleFont = linkPreviewSubtitleFont;
  }
}

export { TextBubbleStyle };
