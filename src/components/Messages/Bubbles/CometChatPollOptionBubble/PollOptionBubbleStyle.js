import { BaseStyles } from "../../../Shared";
/**
 * @class PollOptionBubbleStyle
 * @param {string} height
 * @param {string} width
 * @param {string} border
 * @param {string} background
 * @param {string} borderRadius
 * @param {string} pollOptionTextFont
 * @param {string} pollOptionTextColor
 * @param {string} pollOptionBackground
 * @param {string} selectedPollOptionBackground
 * @param {string} pollOptionBorder
 * @param {string} votePercentTextFont
 * @param {string} votePercentTextColor
 */

class PollOptionBubbleStyle extends BaseStyles {
  constructor({
    pollOptionTextFont = "",
    pollOptionTextColor = "",
    pollOptionsBackground = "",
    selectedPollOptionBackground = "",
    votePercentTextFont = "",
    votePercentTextColor = "",

    width = "100%",
    height = "160px",
    border = "",
    borderRadius = "12px",
    background = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.pollOptionTextFont = pollOptionTextFont;
    this.pollOptionTextColor = pollOptionTextColor;
    this.pollOptionsBackground = pollOptionsBackground;
    this.selectedPollOptionBackground = selectedPollOptionBackground;
    this.votePercentTextFont = votePercentTextFont;
    this.votePercentTextColor = votePercentTextColor;
  }
}
export { PollOptionBubbleStyle };
