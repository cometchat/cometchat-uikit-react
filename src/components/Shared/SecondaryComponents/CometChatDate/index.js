import React from 'react';
import PropTypes from "prop-types";
import * as styles from "./style";
import { DateStyles, localize } from "../../../Shared";

const patterns = {
  timeFormat: "timeFormat",
  dayDateFormat: "dayDateFormat",
  dayDateTimeFormat: "dayDateTimeFormat",
};
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekNames = [
  "Sunday",
  "Monday",
  "Tuseday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * CometChatDate is a component useful for displaying date/time
 * This component displays the date/time based on pattern parameter.
 *
 * @Version 1.0.0
 * @author CometChat
 *
 */
/**
 * CometChatDate is a component useful for displaying date/time
 * This component displays the date/time based on pattern parameter.
 *
 * @Version 1.0.0
 * @author CometChat
 *
 */
const CometChatDate = (props) => {
  let date = new Date(props.timestamp * 1000);

  const getWeekOfDay = () => {
    let weekDay = date.getDay();
    let week = weekNames[weekDay];
    return week.substring(0, 3);
  };

  const getMonthOfDay = () => {
    let month = date.getMonth();
    let mnth = monthNames[month];
    return mnth.substring(0, 3);
  };

  const getDateFormat = () => {
    if (props.pattern === patterns.dayDateFormat) {
      return date.getDate() + " " + getMonthOfDay() + ", " + date.getFullYear();
    }
    let dt = date.getDate();
    if (dt < 10) {
      dt = "0" + dt;
    }
    return dt + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
  };

  const getMinute = (date) => {
    if (date.getMinutes() < 10) {
      return `0${date.getMinutes()}`;
    } else return date.getMinutes();
  };

  const getTimeFormat = () => {
    let timeString = date.getHours();
    let postString = "AM";
    if (timeString > 12) {
      postString = "PM";
      timeString = parseInt(timeString % 12);
    }
    if (timeString < 10) {
      timeString = `0${timeString}`;
    }
    return timeString + ":" + getMinute(date) + " " + postString;
  };

  const getDate = () => {
    const today = new Date();
    if (
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear()
    ) {
      let diff = today.getDate() - date.getDate();
      if (diff === 0) {
        if (props.pattern === patterns.dayDateTimeFormat) {
          return getTimeFormat();
        }
        return localize("TODAY");
      } else if (diff === 1) {
        return localize("YESTERDAY");
      } else if (diff < 7) {
        return getWeekOfDay();
      } else {
        return getDateFormat();
      }
    } else {
      return getDateFormat();
    }
  };

  const getFormattedDate = () => {
    if (props.customPattern) {
      return props.customPattern(props.timestamp);
    } else if (props.pattern && props.pattern != null) {
      let formattedDate = "";
      switch (props.pattern) {
        case patterns.timeFormat:
          formattedDate = getTimeFormat();
          break;
        case patterns.dayDateFormat:
        case patterns.dayDateTimeFormat:
          formattedDate = getDate();
          break;
        default:
          break;
      }
      return formattedDate;
    }
    return null;
  };

  return <span style={styles.textStyle(props)}>{getFormattedDate()}</span>;
};

CometChatDate.defaultProps = {
  timestamp: 0,
  pattern: patterns.timeFormat,
  customPattern: null,
  style: {
    textColor: "rgb(20, 20, 20)",
    textFont: "500 11px Inter,sans-serif",
  },
};

CometChatDate.propTypes = {
  /**
   * Unix epoch time.
   */
  timestamp: PropTypes.number,
  /**
   * Pattern for Date.
   * one of
   * 1. timeFormat: "hh:mm a".
   * 2. dayDateFormat: Today, Yesterday, week-day or "d MMM, yyyy".
   * 3. dayDateTimeFormat: Today, Yesterday, week-day or "dd/mm/yyyy".
   */
  pattern: PropTypes.oneOf([
    patterns.timeFormat,
    patterns.dayDateFormat,
    patterns.dayDateTimeFormat,
  ]),
  /**
   * A function with returning string for custom date reprasentation.
   */
  customPattern: PropTypes.func,
  /**
   * Style
   */
  style: PropTypes.object,
};

export { CometChatDate };
