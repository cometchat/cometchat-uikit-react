import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageCategories, CometChatMessageTypes } from "..";

const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

const emailPattern = new RegExp(
  wordBoundary.start +
    `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
    wordBoundary.end,
  "gi"
);
const urlPattern = new RegExp(
  wordBoundary.start +
    `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
    wordBoundary.end,
  "gi"
);
const phoneNumPattern = new RegExp(
  wordBoundary.start +
    `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
    wordBoundary.end,
  "gi"
);

export const ID = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return "_" + Math.random().toString(36).substr(2, 9);
};

export const getUnixTimestamp = () => {
  return Math.round(+new Date() / 1000);
};

export const getExtensionsData = (message, extensionKey) => {
  if (message?.hasOwnProperty("metadata")) {
    const metadata = message.metadata;
    const injectedObject = metadata["@injected"];
    if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
      const extensionsObject = injectedObject["extensions"];
      if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
        return extensionsObject[extensionKey];
      }
    }
  }

  return null;
};

export const getMetadataByKey = (message, metadataKey) => {
  if (message.hasOwnProperty("metadata")) {
    const metadata = message["metadata"];
    if (metadata.hasOwnProperty(metadataKey)) {
      return metadata[metadataKey];
    }
  }

  return null;
};

// export const getFileMessageMetadata = (message, metadataKey) => {

// 	if (message.hasOwnProperty("metadata")) {
// 		const metadata = message["metadata"];
// 		if (metadata.hasOwnProperty(metadataKey)) {
// 			return metadata[metadataKey];
// 		}
// 	}

// 	return null;
// };

export const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const linkify = (message) => {
  let outputStr = message.replace(
    phoneNumPattern,
    "<a target='blank' rel='noopener noreferrer' href='tel:$&'>$&</a>"
  );
  outputStr = outputStr.replace(
    emailPattern,
    "<a target='blank' rel='noopener noreferrer' href='mailto:$&'>$&</a>"
  );

  const results = outputStr.match(urlPattern);

  results &&
    results.forEach((url) => {
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

export const getCometChatMessage = (messageObject) => {
  if (messageObject.category === CometChatMessageCategories.custom) {
    return new CometChat.CustomMessage(messageObject);
  } else if (
    messageObject.category === CometChatMessageCategories.message &&
    messageObject.type === CometChatMessageTypes.text
  ) {
    const newMessageObject = new CometChat.TextMessage(messageObject);
    return newMessageObject;
  } else {
    return new CometChat.MediaMessage(messageObject);
  }
};
