import { BaseStyles } from "../../../Shared";
/**
 * @class PollBubbleStyle
 * @param {string} height
 * @param {string} width
 * @param {string} border
 * @param {string} background
 * @param {string} borderRadius
 * @param {string} pollQuestionTextFont
 * @param {string} pollQuestionTextColor
 * @param {string} pollOptionTextFont
 * @param {string} pollOptionTextColor
 * @param {string} pollOptionBackground
 * @param {string} selectedPollOptionBackgroun
 * @param {string} totalVoteCountTextFont
 * @param {string} totalVoteCountTextColor
 * @param {string} votePercentTextFont
 * @param {string} votePercentTextColor
 * @param {string} optionsIconTint
 * @param {string} optionBorderRadius
 * @param {string} optionBorder
 */

class PollBubbleStyle extends BaseStyles {
  constructor({
    pollQuestionTextFont = "",
    pollQuestionTextColor = "",
    pollOptionTextFont = "",
    pollOptionTextColor = "",
    pollOptionsBackground = "",
    selectedPollOptionBackground = "",
    totalVoteCountTextFont = "",
    totalVoteCountTextColor = "",
    votePercentTextFont = "",
    votePercentTextColor = "",
    optionsIconTint = "",
    optionBorderRadius = "8px",
    optionBorder = "none",

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
    this.pollQuestionTextFont = pollQuestionTextFont;
    this.pollQuestionTextColor = pollQuestionTextColor;
    this.pollOptionTextFont = pollOptionTextFont;
    this.pollOptionTextColor = pollOptionTextColor;
    this.pollOptionsBackground = pollOptionsBackground;
    this.selectedPollOptionBackground = selectedPollOptionBackground;
    this.totalVoteCountTextFont = totalVoteCountTextFont;
    this.totalVoteCountTextColor = totalVoteCountTextColor;
    this.votePercentTextFont = votePercentTextFont;
    this.votePercentTextColor = votePercentTextColor;
    this.optionsIconTint = optionsIconTint;
    this.optionBorderRadius = optionBorderRadius;
    this.optionBorder = optionBorder;
  }
}
export { PollBubbleStyle };
