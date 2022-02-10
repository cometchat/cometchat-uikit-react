"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linkify = exports.getUnixTimestamp = exports.getMetadataByKey = exports.getExtensionsData = exports.getCometChatMessage = exports.bytesToSize = exports.ID = void 0;

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var wordBoundary = {
  start: "(?:^|:|;|'|\"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)",
  end: "(?=$|:|;|'|\"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)"
};
var emailPattern = new RegExp(wordBoundary.start + "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}" + wordBoundary.end, 'gi');
var urlPattern = new RegExp(wordBoundary.start + "((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,\u263A]+[\\w/#](\\(\\))?)" + wordBoundary.end, 'gi');
var phoneNumPattern = new RegExp(wordBoundary.start + "(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)" + wordBoundary.end, 'gi');

var ID = function ID() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return "_" + Math.random().toString(36).substr(2, 9);
};

exports.ID = ID;

var getUnixTimestamp = function getUnixTimestamp() {
  return Math.round(+new Date() / 1000);
};

exports.getUnixTimestamp = getUnixTimestamp;

var getExtensionsData = function getExtensionsData(message, extensionKey) {
  if (message.hasOwnProperty("metadata")) {
    var metadata = message.metadata;
    var injectedObject = metadata["@injected"];

    if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
      var extensionsObject = injectedObject["extensions"];

      if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
        return extensionsObject[extensionKey];
      }
    }
  }

  return null;
};

exports.getExtensionsData = getExtensionsData;

var getMetadataByKey = function getMetadataByKey(message, metadataKey) {
  if (message.hasOwnProperty("metadata")) {
    var metadata = message["metadata"];

    if (metadata.hasOwnProperty(metadataKey)) {
      return metadata[metadataKey];
    }
  }

  return null;
}; // export const getFileMessageMetadata = (message, metadataKey) => {
// 	if (message.hasOwnProperty("metadata")) {
// 		const metadata = message["metadata"];
// 		if (metadata.hasOwnProperty(metadataKey)) {
// 			return metadata[metadataKey];
// 		}
// 	}
// 	return null;
// };


exports.getMetadataByKey = getMetadataByKey;

var bytesToSize = function bytesToSize(bytes) {
  var decimals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  if (bytes === 0) return "0 Bytes";
  var k = 1024;
  var dm = decimals < 0 ? 0 : decimals;
  var sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

exports.bytesToSize = bytesToSize;

var linkify = function linkify(message) {
  var outputStr = message.replace(phoneNumPattern, "<a target='blank' rel='noopener noreferrer' href='tel:$&'>$&</a>");
  outputStr = outputStr.replace(emailPattern, "<a target='blank' rel='noopener noreferrer' href='mailto:$&'>$&</a>");
  var results = outputStr.match(urlPattern);
  results && results.forEach(function (url) {
    url = url.trim();
    var normalizedURL = url;

    if (!url.startsWith("http")) {
      normalizedURL = "//".concat(url);
    }

    outputStr = outputStr.replace(url, "<a target='blank' rel='noopener noreferrer' href=\"".concat(normalizedURL, "\">").concat(url, "</a>"));
  });
  return outputStr;
};

exports.linkify = linkify;

var getCometChatMessage = function getCometChatMessage(messageObject) {
  if (messageObject.category === _.CometChatMessageCategories.custom) {
    return new _chat.CometChat.CustomMessage(messageObject);
  } else if (messageObject.category === _.CometChatMessageCategories.message && messageObject.type === _.CometChatMessageTypes.text) {
    var newMessageObject = new _chat.CometChat.TextMessage(messageObject);
    return newMessageObject;
  } else {
    return new _chat.CometChat.MediaMessage(messageObject);
  }
};

exports.getCometChatMessage = getCometChatMessage;