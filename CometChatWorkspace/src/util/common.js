/* eslint-disable no-useless-concat */
/* eslint-disable no-extend-native */
import dateFormat from "dateformat";
import Translator from "../resources/localization/translator";

const emailPattern = new RegExp("[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}", "gi");///([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
const urlPattern = new RegExp("(^|[\\s.:;?\\-\\]<\\(])"+"((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)"+"(?=$|[\\s',\\|\\(\\).:;?\\-\\[\\]>\\)])", "gi");
const phoneNumPattern = new RegExp("^\\s*(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)\\s*", "gi");
const milliseconds = 1000;
const seconds = 1 * milliseconds;
const minute = 60 * seconds;
const hour = 60 * minute;
const day = 24 * hour;

export const linkify = (message) => {

    let outputStr = message.replace(phoneNumPattern, "<a target='blank' rel='noopener noreferrer' href='tel:$&'>$&</a>");
    outputStr = outputStr.replace(emailPattern, "<a target='blank' rel='noopener noreferrer' href='mailto:$&'>$&</a>");
    outputStr = outputStr.replace(urlPattern, "<a target='blank' rel='noopener noreferrer' href='$&'>$&</a>");

    return outputStr;
}

export const validateWidgetSettings = (wSettings, checkAgainst) => {

    let output = null;

    if (wSettings && wSettings.hasOwnProperty("main")) {

        if (wSettings.main.hasOwnProperty(checkAgainst)) {
            output = wSettings.main[checkAgainst];
        } else {
            output = false;
        }
    } 
    
    return output;
}

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
}

export const ID = () => {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};

export const getUnixTimestamp = () => {

    return Math.round(+new Date() / 1000);
}

const dateDiffInDays = (a, b) => {

    const milliSecondsPerDay = day;

    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / milliSecondsPerDay);
}


export const getTimeStampForLastMessage = (timestamp, lang) => {

    const timeStampInMilliSeconds = timestamp * 1000;

    const messageTimestamp = new Date(timeStampInMilliSeconds);
    const currentTimestamp = new Date(Date.now());

    const dateDifferenceInDays = dateDiffInDays(messageTimestamp, currentTimestamp);

    if (dateDifferenceInDays < 1) {

        timestamp = dateFormat(messageTimestamp, "shortTime");

    } else if (dateDifferenceInDays < 2) {

        timestamp = Translator.translate("YESTERDAY", lang);

    } else if (dateDifferenceInDays < 7) {

        timestamp = dateFormat(messageTimestamp, "dddd");
        timestamp = Translator.translate(timestamp, lang);

    } else {

        timestamp = dateFormat(messageTimestamp, "dS mmm, yyyy");
    }

    return timestamp;
}

export const getMessageSentTime = (timestamp, lang) => {

    let oTimestamp = null;

    const messageTimestamp = new Date(timestamp) * 1000;
    //const currentTimestamp = Date.now();

    //const diffTimestamp = Math.floor((currentTimestamp - messageTimestamp) / seconds); 

    // if (diffTimestamp < 2) {
    //     oTimestamp = Translator.translate("JUST_NOW", lang);
    // } else {
    //     oTimestamp = dateFormat(messageTimestamp, "shortTime");
    // }

    oTimestamp = dateFormat(messageTimestamp, "shortTime");

    return oTimestamp;
}

export const getMessageDate = (timestamp, lang) => {

    const timeStampInMilliSeconds = timestamp * 1000;

    const messageTimestamp = new Date(timeStampInMilliSeconds);
    const currentTimestamp = new Date(Date.now());

    const dateDifferenceInDays = dateDiffInDays(messageTimestamp, currentTimestamp);

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
}