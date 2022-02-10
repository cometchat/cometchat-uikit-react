"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var Hooks = function Hooks(props, setName, setAvatar, setQuestion, setOptions, setVoteCount) {
  _react.default.useEffect(function () {
    if (props.userName && props.userName.trim().length) {
      setName(props.userName);
    } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
      setName(props.messageObject.sender.name);
    }
  }, [props.userName, props.messageObject, setName]);

  _react.default.useEffect(function () {
    if (props.avatar && props.avatar.length) {
      setAvatar(props.avatar);
    } else if (props.messageObject && props.messageObject.sender) {
      setAvatar(props.messageObject.sender);
    }
  }, [props.avatar, props.messageObject, setAvatar]);

  _react.default.useEffect(function () {
    if (props.pollQuestion && props.pollQuestion.trim().length) {
      setQuestion(props.pollQuestion);
    } else if (props.messageObject) {
      var pollsData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.polls);

      if (pollsData && pollsData.question && pollsData.question.trim().length) {
        setQuestion(pollsData.question);
      }
    }
  }, [props.pollQuestion, props.messageObject, setQuestion]);

  _react.default.useEffect(function () {
    if (props.pollOptions && props.pollOptions.length) {
      setOptions(props.pollOptions);
    } else if (props.messageObject) {
      var pollsData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.polls);

      if (pollsData && pollsData.results && pollsData.results.options && (0, _typeof2.default)(pollsData.results.options) === "object" && Object.keys(pollsData.results.options).length) {
        setOptions(pollsData.results.options);
      }
    }
  }, [props.pollOptions, props.messageObject, setOptions]);

  _react.default.useEffect(function () {
    if (props.voteCount && props.voteCount.length) {
      setVoteCount(props.voteCount);
    } else if (props.messageObject) {
      var pollsData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.polls);

      if (pollsData && pollsData.results && pollsData.results.total && pollsData.results.total > 0) {
        setVoteCount(pollsData.results.total);
      }
    }
  }, [props.voteCount, props.messageObject, setVoteCount]);
};

exports.Hooks = Hooks;