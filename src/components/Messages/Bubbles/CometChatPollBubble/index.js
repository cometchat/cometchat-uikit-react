import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatTheme, fontHelper } from "../../..";

import { CometChatPollOptionBubble } from "../";

import { CometChatMessageEvents } from "../../../";

import { Hooks } from "./hooks";

import checkImg from "./resources/checkmark.svg";

import {
  messageKitPollBubbleBlockStyle,
  messagePollBubbleBlockStyle,
  pollQuestionStyle,
  pollAnswerStyle,
  voteCountStyle,
  voteCountTextStyle,
} from "./style";

/**
 *
 * CometChatPollBubble is UI component for poll message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatPollBubble = (props) => {
  const [question, setQuestion] = React.useState(null);
  const [options, setOptions] = React.useState({});
  const [voteCount, setVoteCount] = React.useState(0);
  const [pollId, setPollId] = React.useState();

  const theme = new CometChatTheme(props.theme) || new CometChatTheme({});
  const getPollOptions = () => {
    let votePercent = 0;
    const optionsTemplate = [];
    Object.entries(options)?.forEach(([optionKey, option]) => {
      const fraction = option.count / voteCount;
      votePercent = fraction.toLocaleString("en", { style: "percent" });

      let backgroundColor =
        props.style.background || theme.palette.background[theme.palette.mode];
      if (
        option.hasOwnProperty("voters") &&
        option.voters.hasOwnProperty(props.loggedInUser?.uid) &&
        voteCount
      ) {
        backgroundColor = theme?.palette?.getPrimary();
      } else {
        backgroundColor = theme.palette.accent100[theme.palette.mode];
      }
      optionsTemplate.push(
        <CometChatPollOptionBubble
          optionText={option.text}
          votePercent={votePercent}
          optionId={optionKey}
          voteCount={voteCount}
          optionIconURL={checkImg}
          theme={theme}
          key={optionKey}
          style={{
            pollOptionTextFont:
              props.style.pollOptionsFont ||
              fontHelper(theme.typography.subtitle1),
            pollOptionTextColor:
              props.style.pollOptionsColor ||
              theme?.palette?.getAccent(),
            pollOptionBackground: props.style.pollOptionsBackground,
            optionIconTint:
              props.style.iconTint ||
              theme.palette.accent500[theme.palette.mode],
            selectedPollOptionBackground:
              backgroundColor || theme?.palette?.getPrimary(),
            pollOptionBorder: props.style.pollOptionBorder,
            votePercentTextFont:
              props.style.votePercentTextFont ||
              fontHelper(theme.typography.subtitle1),
            votePercentTextColor:
              props.style.pollOptionsColor ||
              theme?.palette?.getAccent(),
          }}
          loggedInUser={props.loggedInUser}
          onClick={votingPoll}
        />
      );
    });

    return optionsTemplate;
  };

  const getPollsMessage = () => {
    let voteCountText = `${voteCount} people voted`;

    return (
      <div
        style={messageKitPollBubbleBlockStyle(props, theme)}
        className="message_kit__blocks"
      >
        <div
          style={messagePollBubbleBlockStyle(props)}
          className="message__message-blocks"
        >
          <p
            style={pollQuestionStyle(props, theme)}
            className="message__message-pollquestion"
          >
            {question}
          </p>
        </div>
        <ul
          style={pollAnswerStyle(props)}
          className="message__message-polloptions"
        >
          {getPollOptions()}
        </ul>
        <div
          style={voteCountStyle(props, theme)}
          className="message__message-votecount"
        >
          <p style={voteCountTextStyle(props, theme)}>{voteCountText}</p>
        </div>
      </div>
    );
  };

  const errorHandler = (errorCode) => {
    CometChatMessageEvents.emit(
      CometChatMessageEvents.onMessageError,
      errorCode
    );
  };

  /** vote poll option */
  const votingPoll = (optionNumber) => {
    try {
      if (props.loggedInUser.uid !== props.messageObject?.sender.uid) {
        CometChat.callExtension("polls", "POST", "v2/vote", {
          vote: optionNumber,
          id: pollId,
        });
      } else {
        return;
      }
    } catch (error) {
      errorHandler(error);
    }
  };

  Hooks(props, setQuestion, setOptions, setVoteCount, setPollId);

  return getPollsMessage();
};

CometChatPollBubble.defaultProps = {
  messageObject: null,
  pollQuestion: "",
  options: [],
  totalVoteCount: 0,
  optionIconURL: "",
  style: {
    width: "100%",
    height: "100%",
    border: "0 none",
    borderRadius: "12px",
    background: "transparent",
    votePercentTextFont: "",
    votePercentTextColor: "",
    pollQuestionTextColor: "#fff",
    pollQuestionTextFont: "400 15px Inter,sans-serif",
    pollOptionTextFont: "400 15px Inter,sans-serif",
    pollOptionTextColor: "#39f",
    pollOptionsBackground: "#fff",
    totalVoteCountTextFont: "400 13px Inter,sans-serif",
    totalVoteCountTextColor: "#fff",
    optionIconTint: "rgb(246,246,246)",
    pollOptionBorder: "",
    selectedPollOptionBackground: "",
  },
};

CometChatPollBubble.propTypes = {
  messageObject: PropTypes.object,
  pollQuestion: PropTypes.string,
  options: PropTypes.array,
  optionIconURL: PropTypes.string,
  pollQuestion: PropTypes.string,
  totalVoteCount: PropTypes.number,
  style: PropTypes.object,
};

export { CometChatPollBubble };
