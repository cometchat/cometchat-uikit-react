/* eslint-disable no-useless-concat */
/* eslint-disable no-extend-native */
import dateFormat from "dateformat";
import Translator from "../resources/localization/translator";
const milliseconds = 1000;
const seconds = 1 * milliseconds;
const minute = 60 * seconds;
const hour = 60 * minute;
const day = 24 * hour;
export const isEmail = (text) => {
	const emailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	return emailRegEx.test(text);
};

export const isPhoneNumber = (text) => {
	const phoneRegEx = /^(\+\d{1,3}[- ]?)?\d{10}$/;
	return phoneRegEx.test(text);
};
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

export const checkMessageForExtensionsData = (message, extensionKey) => {
	let output = null;

	if (message.hasOwnProperty("metadata")) {
		const metadata = message.metadata;
		const injectedObject = metadata["@injected"];
		if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
			const extensionsObject = injectedObject["extensions"];
			if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
				output = extensionsObject[extensionKey];
			}
		}
	}

	return output;
};

export const getMessageFileMetadata = (message, metadataKey) => {
	let fileMetadata = null;
	if (message.hasOwnProperty("metadata")) {
		const metadata = message["metadata"];
		if (metadata.hasOwnProperty(metadataKey)) {
			fileMetadata = metadata[metadataKey];
		}
	}

	return fileMetadata;
};

export const ID = () => {
	// Math.random should be unique because of its seeding algorithm.
	// Convert it to base 36 (numbers + letters), and grab the first 9 characters
	// after the decimal.
	return "_" + Math.random().toString(36).substr(2, 9);
};

export const getUnixTimestamp = () => {
	return Math.round(+new Date() / 1000);
};

const dateDiffInDays = (a, b) => {
	const milliSecondsPerDay = day;

	// Discard the time and time-zone information.
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

	return Math.floor((utc2 - utc1) / milliSecondsPerDay);
};

export const getTimeStampForLastMessage = (timestamp, lang) => {
	const timeStampInMilliSeconds = timestamp * 1000;

	const messageTimestamp = new Date(timeStampInMilliSeconds);
	const currentTimestamp = new Date(Date.now());

	const dateDifferenceInDays = dateDiffInDays(
		messageTimestamp,
		currentTimestamp
	);

	if (dateDifferenceInDays < 1) {
		timestamp = dateFormat(messageTimestamp, "shortTime");
	} else if (dateDifferenceInDays < 2) {
		timestamp = Translator.translate("YESTERDAY", lang);
	} else if (dateDifferenceInDays < 7) {
		timestamp = dateFormat(messageTimestamp, "dddd");
		timestamp = Translator.translate(timestamp, lang);
	} else {
		timestamp = dateFormat(messageTimestamp, "dS mmm");
	}

	return timestamp;
};

export const getMessageSentTime = (timestamp, lang) => {
	let oTimestamp = null;

	const messageTimestamp = new Date(timestamp) * 1000;
	oTimestamp = dateFormat(messageTimestamp, "shortTime");

	return oTimestamp;
};

export const getMessageDate = (timestamp, lang) => {
	const timeStampInMilliSeconds = timestamp * 1000;

	const messageTimestamp = new Date(timeStampInMilliSeconds);
	const currentTimestamp = new Date(Date.now());

	const dateDifferenceInDays = dateDiffInDays(
		messageTimestamp,
		currentTimestamp
	);

	if (dateDifferenceInDays < 1) {
		timestamp = Translator.translate("TODAY", lang);
	} else if (dateDifferenceInDays < 2) {
		timestamp = Translator.translate("YESTERDAY", lang);
	} else if (dateDifferenceInDays < 7) {
		timestamp = dateFormat(messageTimestamp, "dddd");
		timestamp = Translator.translate(timestamp, lang);
	} else {
		timestamp = dateFormat(timeStampInMilliSeconds, "dS mmm, yyyy");
	}

	return timestamp;
};

export const countEmojiOccurences = (string, word) => {
	if (string.split(word).length - 1 >= 3) {
		return 3;
	} else {
		let content = string;
		content = string.replace(
			/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g,
			""
		);

		if (content.length > 0) {
			return 3;
		} else {
			return string.split(word).length - 1;
		}
	}
};
