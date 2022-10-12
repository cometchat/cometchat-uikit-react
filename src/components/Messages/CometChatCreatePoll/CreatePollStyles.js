import { BaseStyles } from "../../Shared";
/**
 * @class CreatePollStyles
 * @param {String} boxShadow
 * @param {String} titleFont
 * @param {String} titleColor
 * @param {String} closeIconTint
 * @param {String} errorTextFont
 * @param {String} errorTextColor
 * @param {String} questionInputBorder
 * @param {String} questionInputBorderRadius
 * @param {String} questionInputBoxShadow
 * @param {String} questionInputBackground
 * @param {String} questionPlaceholderTextFont
 * @param {String} questionPlaceholderTextColor
 * @param {String} questionInputTextFont
 * @param {String} questionInputTextColor
 * @param {String} answerHelpTextFont
 * @param {String} answerHelpTextColor
 * @param {String} answerInputBoxShadow
 * @param {String} answerInputBackground
 * @param {String} answerInputTextFont
 * @param {String} answerInputTextColor
 * @param {String} answerInputBorder
 * @param {String} answerInputBorderRadius
 * @param {String} answerPlaceholderTextFont
 * @param {String} answerPlaceholderTextColor
 * @param {String} addAnswerButtonTextColor
 * @param {String} addAnswerButtonTextFont
 * @param {String} addAnswerIconTint
 * @param {String} createPollButtonBorder
 * @param {String} createPollButtonBorderRadius
 * @param {String} createPollButtonBackground
 * @param {String} createPollButtonTextFont
 * @param {String} createPollButtonTextColor
 */

class CreatePollStyles extends BaseStyles {
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
    activeBackground = "",
  }) {
    super({
      width,
      height,
      background,
      activeBackground,
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
export { CreatePollStyles };
