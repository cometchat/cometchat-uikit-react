import { BaseStyles } from "../../Shared";
/**
 * @class CreatePollStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} boxShadow
 * @param {string} titleFont
 * @param {string} titleColor
 * @param {string} closeIconTint
 * @param {string} errorTextFont
 * @param {string} errorTextColor
 * @param {string} questionInputBorder
 * @param {string} questionInputBorderRadius
 * @param {string} questionInputBoxShadow
 * @param {string} questionInputBackground
 * @param {string} questionPlaceholderTextFont
 * @param {string} questionPlaceholderTextColor
 * @param {string} questionInputTextFont
 * @param {string} questionInputTextColor
 * @param {string} answerHelpTextFont
 * @param {string} answerHelpTextColor
 * @param {string} answerInputBoxShadow
 * @param {string} answerInputBackground
 * @param {string} answerInputTextFont
 * @param {string} answerInputTextColor
 * @param {string} answerInputBorder
 * @param {string} answerInputBorderRadius
 * @param {string} answerPlaceholderTextFont
 * @param {string} answerPlaceholderTextColor
 * @param {string} addAnswerButtonTextColor
 * @param {string} addAnswerButtonTextFont
 * @param {string} addAnswerIconTint
 * @param {string} createPollButtonBorder
 * @param {string} createPollButtonBorderRadius
 * @param {string} createPollButtonBackground
 * @param {string} createPollButtonTextFont
 * @param {string} createPollButtonTextColor
 */

class CreatePollStyle extends BaseStyles {
  constructor({
    boxShadow = "",
    titleFont = "",
    titleColor = "",
    closeIconTint = "",
    errorTextFont = "",
    errorTextColor = "",
    questionInputBorder = "",
    questionInputBorderRadius = "",
    questionInputBoxShadow = "",
    questionInputBackground = "",
    questionPlaceholderTextFont = "",
    questionPlaceholderTextColor = "",
    questionInputTextFont = "",
    questionInputTextColor = "",
    answerHelpTextFont = "",
    answerHelpTextColor = "",
    answerInputBoxShadow = "",
    answerInputBackground = "",
    answerInputTextFont = "",
    answerInputTextColor = "",
    answerInputBorder = "",
    answerInputBorderRadius = "",
    answerPlaceholderTextFont = "",
    answerPlaceholderTextColor = "",
    addAnswerButtonTextColor = "",
    addAnswerButtonTextFont = "",
    addAnswerIconTint = "",
    createPollButtonBorder = "",
    createPollButtonBorderRadius = "",
    createPollButtonBackground = "",
    createPollButtonTextFont = "",
    createPollButtonTextColor = "",

    width = "360px",
    height = "560px",
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

    this.boxShadow = boxShadow;
    this.titleFont = titleFont;
    this.titleColor = titleColor;
    this.closeIconTint = closeIconTint;
    this.errorTextFont = errorTextFont;
    this.errorTextColor = errorTextColor;
    this.questionInputBorder = questionInputBorder;
    this.questionInputBorderRadius = questionInputBorderRadius;
    this.questionInputBoxShadow = questionInputBoxShadow;
    this.questionInputBackground = questionInputBackground;
    this.questionPlaceholderTextFont = questionPlaceholderTextFont;
    this.questionPlaceholderTextColor = questionPlaceholderTextColor;
    this.questionInputTextFont = questionInputTextFont;
    this.questionInputTextColor = questionInputTextColor;
    this.answerHelpTextFont = answerHelpTextFont;
    this.answerHelpTextColor = answerHelpTextColor;
    this.answerInputBoxShadow = answerInputBoxShadow;
    this.answerInputBackground = answerInputBackground;
    this.answerInputTextFont = answerInputTextFont;
    this.answerInputTextColor = answerInputTextColor;
    this.answerInputBorder = answerInputBorder;
    this.answerInputBorderRadius = answerInputBorderRadius;
    this.answerPlaceholderTextFont = answerPlaceholderTextFont;
    this.answerPlaceholderTextColor = answerPlaceholderTextColor;
    this.addAnswerButtonTextColor = addAnswerButtonTextColor;
    this.addAnswerButtonTextFont = addAnswerButtonTextFont;
    this.addAnswerIconTint = addAnswerIconTint;
    this.createPollButtonBorder = createPollButtonBorder;
    this.createPollButtonBorderRadius = createPollButtonBorderRadius;
    this.createPollButtonBackground = createPollButtonBackground;
    this.createPollButtonTextFont = createPollButtonTextFont;
    this.createPollButtonTextColor = createPollButtonTextColor;
  }
}
export { CreatePollStyle };
