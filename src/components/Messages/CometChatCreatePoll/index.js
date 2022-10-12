import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import PropTypes from "prop-types";
import { localize } from "../..";

import {
  CometChatTheme,
  ExtensionURLs,
  fontHelper,
  ExtensionConstants,
  BaseStyles,
} from "../../Shared";

import { CometChatMessageEvents, CreatePollStyles } from "../";

import { Hooks } from "./hooks";
import { CometChatCreatePollOptions } from "../CometChatCreatePollOptions";

import {
  createPollWrapperStyle,
  createPollBodyStyle,
  questionInputStyle,
  answerInputStyle,
  createPollWarnMessageStyle,
  iconWrapperStyle,
  createPollTitleStyle,
  closeIconStyle,
  addOptionIconStyle,
  createPollQuestionAnsStyle,
  buttonStyle,
  helperTextStyle,
  addItemStyle,
  addAnswerInutFieldStyle,
  sendButtonStyle,
} from "./style";

import addIcon from "./resources/plus.svg";
import deleteIcon from "./resources/delete.svg";
import closeIcon from "./resources/close.svg";

const CometChatCreatePoll = (props) => {
  const [loggedInUser, setLoggedInUser] = React.useState(null);
  const [chatWith, setChatWith] = React.useState(null);
  const [chatWithId, setChatWithId] = React.useState(null);

  const [pollOptions, setPollOptions] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const questionRef = React.createRef();
  const optionOneRef = React.createRef();
  const optionTwoRef = React.createRef();
  const chatRef = React.useRef(chatWith);

  const theme = new CometChatTheme(props.theme) ?? new CometChatTheme({});

  const addPollOption = () => {
    const options = [...pollOptions];
    options.push({ value: "", id: new Date().getTime() });
    setPollOptions(options);
  };

  const removePollOption = (option) => {
    const options = [...pollOptions];
    const optionKey = options.findIndex((opt) => opt.id === option.id);
    if (optionKey > -1) {
      options.splice(optionKey, 1);
      setPollOptions(options);
    }
  };

  const optionChangeHandler = (event, option) => {
    const options = [...pollOptions];
    const optionKey = options.findIndex((opt) => opt.id === option.id);
    if (optionKey > -1) {
      const newOption = { ...option, value: event.target.value };
      options.splice(optionKey, 1, newOption);
      setPollOptions(options);
    }
  };

  const createPoll = () => {
    const question = questionRef.current.value.trim();
    const firstOption = optionOneRef.current.value.trim();
    const secondOption = optionTwoRef.current.value.trim();
    const optionItems = [firstOption, secondOption];

    if (question.length === 0) {
      setError(localize("INVALID_POLL_QUESTION"));
      return false;
    }

    if (firstOption.length === 0 || secondOption.length === 0) {
      setError(localize("INVALID_POLL_OPTION"));
      return false;
    }

    pollOptions.forEach(function (option) {
      optionItems.push(option.value);
    });

    setIsCreating(true);
    setError(localize(""));

    CometChat.callExtension(
      ExtensionConstants.polls,
      ExtensionConstants.post,
      ExtensionURLs.poll,
      {
        question: question,
        options: optionItems,
        receiver: chatWithId,
        receiverType: chatWith,
      }
    )
      .then((response) => {
        if (
          response &&
          response.hasOwnProperty("success") &&
          response["success"] === true
        ) {
          setIsCreating(false);
          props.onCreatePoll();
          //this.props.actionGenerated(enums.ACTIONS["POLL_CREATED"]);
        } else {
          setError(localize("SOMETHING_WRONG"));
        }
      })
      .catch((error) => {
        setIsCreating(false);
        setError(localize("SOMETHING_WRONG"));
        CometChatMessageEvents.emit(
          CometChatMessageEvents.onMessageError,
          error
        );
      });
  };

  Hooks(props, setLoggedInUser, setChatWith, setChatWithId, chatRef);

  const optionList = [...pollOptions];
  const pollOptionView = optionList.map((option, index) => {
    return (
      <CometChatCreatePollOptions
        key={index}
        option={option}
        style={{
          ...new BaseStyles(
            "100%",
            "46px",
            props.style.answerInputBackground,
            props.style.answerInputBorder,
            props.style.answerInputBorderRadius,
            ""
          ),
          deleteIconTint:
            props.style.deleteIconTint ||
            theme.palette.accent600[theme.palette.mode],
          boxShadow: props.style.answerInputBoxShadow || "",
          inputTextFont:
            props.style.answerInputTextFont ||
            fontHelper(theme.typography.subtitle1),
          inputTextColor:
            props.style.answerInputTextColor || theme?.palette?.getAccent(),
          placeholderTextFont:
            props.style.answerPlaceholderTextFont ||
            fontHelper(theme.typography.subtitle1),
          placeholderTextColor:
            props.style.answerPlaceholderTextColor ||
            theme.palette.accent600[theme.palette.mode],
          inputStyles: answerInputStyle(props),
        }}
        theme={theme}
        styles={createPollQuestionAnsStyle()}
        placeholderText={`${localize("ANSWER")} ${index + 3}`}
        deleteIconURL={deleteIcon}
        onDeleteClick={removePollOption}
        onChangeHandler={optionChangeHandler}
      />
    );
  });

  const createText = isCreating ? "Sending" : "Send";

  return (
    <div
      className="createpoll__wrapper"
      style={createPollWrapperStyle(props, theme)}
    >
      <div className="createpoll__header">
        <p
          className="createpoll__title"
          style={createPollTitleStyle(props, theme)}
        >
          {props.title}
        </p>
        <span
          className="close__createpoll"
          style={closeIconStyle(props, closeIcon, theme)}
          onClick={props.onClose}
        ></span>
      </div>
      <div className="createpoll__body" style={createPollBodyStyle()}>
        <div className="createpoll__warning__message">
          <p style={createPollWarnMessageStyle(props, theme)}>{error}</p>
        </div>
        <div
          className="createpoll__question__wrapper"
          style={createPollQuestionAnsStyle()}
        >
          <input
            ref={questionRef}
            type="text"
            autoFocus
            tabIndex="1"
            style={questionInputStyle(props, theme)}
            placeholder={props.questionPlaceholderText}
          />
        </div>
        <div
          className="createpoll__helper__text"
          style={helperTextStyle(props, theme)}
        >
          <label>{props.answerHelpText}</label>
        </div>
        <div
          className="createpoll__answer__wrapper"
          style={createPollQuestionAnsStyle()}
        >
          <input
            type="text"
            tabIndex="1"
            style={answerInputStyle(props, theme)}
            placeholder={`${props.answerPlaceholderText} 1`}
            ref={optionOneRef}
          />
        </div>
        <div
          className="createpoll__answer__wrapper"
          style={createPollQuestionAnsStyle()}
        >
          <input
            type="text"
            tabIndex="1"
            style={answerInputStyle(props, theme)}
            placeholder={`${props.answerPlaceholderText} 2`}
            ref={optionTwoRef}
          />
        </div>
        {pollOptionView}
        <div
          className="addanswer__inputfield"
          style={addAnswerInutFieldStyle()}
        >
          <div className="remove__answer__field" style={iconWrapperStyle()}>
            <span
              style={addOptionIconStyle(props, addIcon, theme)}
              onClick={addPollOption}
            ></span>
          </div>
          <div>
            <label
              className="add__answer__button__text"
              style={addItemStyle(props, theme)}
            >
              {props.addAnswerText}
            </label>
          </div>
        </div>
        <div className="send__button" style={sendButtonStyle()}>
          <button style={buttonStyle(props, theme)} onClick={createPoll}>
            {createText}
          </button>
        </div>
      </div>
    </div>
  );
};
CometChatCreatePoll.defaultProps = {
  user: null,
  group: null,
  title: "",
  defaultAnswers: 2,
  questionPlaceholderText: "",
  answerPlaceholderText: "",
  answerHelpText: "",
  addAnswerText: "",
  addAnswerIconURL: "",
  closeIconURL: "",
  createPollButtonText: "",
  deleteIconURL: "",
  onClose: null,
  onCreatePoll: null,
  style: {
    width: "280px",
    height: "100%",
    border: "1px solid RGBA(20, 20, 20, 0.04)",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "",
    titleFont: "700 22px Inter,sans-serif",
    titleColor: "RGB(20, 20, 20)",
    closeIconTint: "RGB(51, 153, 255)",
    errorTextFont: "400 12px Inter,sans-serif",
    errorTextColor: "red",
    questionInputBorder: "1px solid RGBA(20, 20, 20, 0.04)",
    questionInputBorderRadius: "8px",
    questionInputBoxShadow: "",
    questionInputBackground: "RGBA(20, 20, 20, 0.04)",
    questionPlaceholderTextFont: "400 15px Inter,sans-serif",
    questionPlaceholderTextColor: "RGBA(20, 20, 20, 0.6)",
    questionInputTextFont: "400 15px Inter,sans-serif",
    questionInputTextColor: "RGB(20, 20, 20)",
    answerHelpTextFont: "500 12px Inter,sans-serif",
    answerHelpTextColor: "RGBA(20, 20, 20, 0.46)",
    answerInputBoxShadow: "",
    answerInputBackground: "RGBA(20, 20, 20, 0.04)",
    answerInputTextFont: "400 15px Inter,sans-serif",
    answerInputTextColor: "RGB(20, 20, 20)",
    answerInputBorder: "1px solid RGBA(20, 20, 20, 0.04)",
    answerInputBorderRadius: "8px",
    answerPlaceholderTextFont: "400 15px Inter,sans-serif",
    answerPlaceholderTextColor: "RGBA(20, 20, 20, 0.6)",
    addAnswerButtonTextColor: "RGB(51, 153, 255)",
    addAnswerButtonTextFont: "500 15px Inter,sans-serif",
    addAnswerIconTint: "RGB(51, 153, 255)",
    createPollButtonBorder: "1px solid RGB(51, 153, 255)",
    createPollButtonBorderRadius: "12px",
    createPollButtonBackground: "RGB(51, 153, 255)",
    createPollButtonTextFont: "400 15px Inter,sans-serif",
    createPollButtonTextColor: "#fff",
  },
};
CometChatCreatePoll.propTypes = {
  user: PropTypes.object,
  group: PropTypes.object,
  title: PropTypes.string,
  defaultAnswers: PropTypes.number,
  questionPlaceholderText: PropTypes.string,
  answerPlaceholderText: PropTypes.string,
  answerHelpText: PropTypes.string,
  addAnswerText: PropTypes.string,
  addAnswerIconURL: PropTypes.string,
  onClose: PropTypes.func,
  onCreatePoll: PropTypes.func,
  deleteIconURL: PropTypes.string,
  closeIconURL: PropTypes.string,
  createPollButtonText: PropTypes.string,
  style: PropTypes.object,
};
export { CometChatCreatePoll };
