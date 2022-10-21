import React from "react";
import PropTypes from "prop-types";

import {
  emailPattern,
  urlPattern,
  phoneNumPattern,
} from "../../CometChatMessageConstants";
import {
  getExtensionsData,
  ExtensionConstants,
  CometChatTheme,
} from "../../..";
import {
  messageTextBubbleStyle,
  messageKitTextBubbleBlockStyle,
  /** link previw styles*/
  messagePreviewContainerStyle,
  messagePreviewWrapperStyle,
  previewImageStyle,
  previewDataStyle,
  previewTitleStyle,
  previewLinkStyle,
  linkSubtitleStyle,
} from "./style";
import { Hooks } from "./hooks";

const CometChatTextBubble = (props) => {
  const [linkPreviewData, setLinkPreview] = React.useState();

  const theme = props.theme
    ? new CometChatTheme(props?.theme)
    : new CometChatTheme({});

  const linkify = (messageText) => {
    let outputStr = messageText?.replace(
      phoneNumPattern,
      "<a target='blank' rel='noopener noreferrer' href='tel:$&'>$&</a>"
    );
    outputStr = outputStr?.replace(
      emailPattern,
      "<a target='blank' rel='noopener noreferrer' href='mailto:$&'>$&</a>"
    );

    const results = outputStr?.match(urlPattern);

    results &&
      results?.forEach((url) => {
        url = url.trim();
        let normalizedURL = url;
        if (!url.startsWith("http")) {
          normalizedURL = `//${url}`;
        }
        outputStr = outputStr.replace(
          url,
          `<a target='blank' rel='noopener noreferrer' href="${normalizedURL}">${url}</a>`
        );
      });

    return outputStr;
  };

  function linkPreviewHandler(preview) {
    const linkObject = preview["links"][0];

    const linkText = linkObject["url"];

    return (
      <div
        style={messagePreviewContainerStyle(props, theme)}
        className="message__preview"
      >
        <div style={messagePreviewWrapperStyle()} className="preview__card">
          <div
            style={previewImageStyle(linkObject["image"])}
            className="card__image"
          ></div>
          <div style={previewDataStyle()} className="card__info">
            <div
              style={previewTitleStyle(props, theme)}
              className="card__title"
            >
              <span>{linkObject["title"]}</span>
            </div>
          </div>
          <div style={previewLinkStyle()} className="card__link">
            <a
              href={linkObject["url"]}
              target="_blank"
              rel="noopener noreferrer"
              style={linkSubtitleStyle(props, theme)}
            >
              {linkText}
            </a>
          </div>
        </div>
      </div>
    );
  }

  Hooks(props, setLinkPreview);

  const getMessageText = () => {
    if (linkPreviewData && linkPreviewData?.links[0]) {
      return linkPreviewHandler(linkPreviewData);
    }

    let messageText;
    if (props.text && props.text.length) {
      messageText = props.text;
    }
    if (props?.messageObject && props?.messageObject?.text) {
      messageText = props?.messageObject?.text;

      //xss extensions data
      const xssData = getExtensionsData(
        props.messageObject,
        ExtensionConstants.xssFilter
      );
      if (
        xssData &&
        xssData.hasOwnProperty(ExtensionConstants.sanitizedText) &&
        xssData.hasOwnProperty(ExtensionConstants.hasXSS) &&
        xssData.hasXSS === "yes"
      ) {
        messageText = xssData.sanitized_text;
      }

      //datamasking extensions data
      const maskedData = getExtensionsData(
        props.messageObject,
        ExtensionConstants.dataMasking
      );
      if (
        maskedData &&
        maskedData.hasOwnProperty("data") &&
        maskedData.data.hasOwnProperty(ExtensionConstants.sensitiveData) &&
        maskedData.data.hasOwnProperty(ExtensionConstants.messageMasked) &&
        maskedData.data.sensitive_data === "yes"
      ) {
        messageText = maskedData.data.message_masked;
      }

      //profanity extensions data
      const profaneData = getExtensionsData(
        props.messageObject,
        ExtensionConstants.profanityFilter
      );
      if (
        profaneData &&
        profaneData.hasOwnProperty(ExtensionConstants.profanity) &&
        profaneData.hasOwnProperty(ExtensionConstants.messageClean) &&
        profaneData.profanity === "yes"
      ) {
        messageText = profaneData.message_clean;
      }
    }

    const formatedText = linkify(messageText);
    const parseText = () => (
      <div dangerouslySetInnerHTML={{ __html: formatedText }} />
    );

    return (
      <div
        style={messageKitTextBubbleBlockStyle(props, theme)}
        className="message_kit__blocks"
      >
        <p
          className="message__message-blocks"
          style={messageTextBubbleStyle(props, theme, parseText())}
        >
          {parseText()}
        </p>
      </div>
    );
  };

  return getMessageText();
};

CometChatTextBubble.defaultProps = {
  messageObject: null,
  text: "",
  linkPreviewTitle: "",
  linkPreviewSubtitle: "",
  style: {
    width: "",
    height: "",
    border: "0 none",
    background: "rgb(255,255,255)",
    borderRadius: "8px",
    textFont: "",
    textColor: "",
    linkPreviewTitleFont: "",
    linkPreviewTitleColor: "",
    linkPreviewSubtitleFont: "",
    linkPreviewSubtitleColor: "",
    linkPreviewBackgroundColor: "",
  },
};

CometChatTextBubble.propTypes = {
  messageObject: PropTypes.object,
  text: PropTypes.string,
  linkPreviewTitle: PropTypes.string,
  linkPreviewSubtitle: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatTextBubble };
