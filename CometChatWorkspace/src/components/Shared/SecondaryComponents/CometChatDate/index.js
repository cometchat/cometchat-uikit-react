import React from "react";
import PropTypes from "prop-types";

import { timeStyle } from "./style";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekNames = ["Sunday", "Monday", "Tuseday", "Wednesday", "thursday", "Friday", "Saturday"];

const CometChatDate = props => {

	const [curGmtTime] = React.useState(new Date());
	const [gmtTime] = React.useState(new Date(props.timeStamp * 1000));
	const [lastDigit] = React.useState(gmtTime.getDate() % 10);
	const [stampDate] = React.useState(gmtTime.getDate());

	//check date in same week or not
	const isDateInThisWeek = date => {
		const todayObj = new Date();
		const todayDate = todayObj.getDate();
		const todayDay = todayObj.getDay();
		//get first date of week
		const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));
		//get last date of week
		const lastDayOfWeek = new Date(firstDayOfWeek);
		lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
		// if date is equal or within the first and last dates of the week
		return date >= firstDayOfWeek && date <= lastDayOfWeek;
	}

	//"DD:MM:YYYY"
	const dateWithYear = (lastDigit, gmtTime) => {
		let dateStr = "";
		if (lastDigit === 1) {
			dateStr = stampDate + "st";
		} else if (lastDigit === 2) {
			dateStr = stampDate + "nd";
		} else if (lastDigit === 3) {
			dateStr = stampDate + "rd";
		} else {
			dateStr = stampDate + "th";
		}
		return dateStr + " " + monthNames[gmtTime.getMonth()].slice(0, 3) + " " + gmtTime.getFullYear();
	}

	//HH:MM AM/PM
	const twelveHours = (gmtTime) => {
		let timeWithSec = gmtTime.toLocaleTimeString("en-US");
		let lastIndex = timeWithSec.lastIndexOf(":");
		let timeWithoutSec = timeWithSec.slice(0, lastIndex) + timeWithSec.slice(lastIndex + 3);
		return timeWithoutSec;
	}

	//HH:MM
	const twentyFourHours = (gmtTime) => {
		return gmtTime.getHours() + ":" + gmtTime.getMinutes();
	}

	//weekdays or "DD:MM:YYYY"
	const getDays = (gmtTime, curGmtTime) => {
		let day = "";
		if (isDateInThisWeek(gmtTime)) {
			if (gmtTime.getDate() === curGmtTime.getDate()) {
				day = "Today";
			} else if (gmtTime.getDate() + 1 === curGmtTime.getDate()) {
				day = "Yesterday";
			} else {
				day = weekNames[gmtTime.getDay()];
			}
		} else if (gmtTime.getDate() + 1 === curGmtTime.getDate()) {
			day = "Yesterday";
		} else {
			day = dateWithYear(lastDigit, gmtTime);
		}
		return day;
	}

	//Date with time "29th Nov 2021, 4:29 PM"
	const dateWithTimeTwelveHours = (lastDigit, gmtTime) => {
		let dateStr = "";
		if (lastDigit === 1) {
			dateStr = stampDate + "st";
		} else if (lastDigit === 2) {
			dateStr = stampDate + "nd";
		} else if (lastDigit === 3) {
			dateStr = stampDate + "rd";
		} else {
			dateStr = stampDate + "th";
		}
		let fullDate = dateStr + " " + monthNames[gmtTime.getMonth()].slice(0, 3) + " " + gmtTime.getFullYear();
		return fullDate + ", " + twelveHours(gmtTime);
	}

	//date with "29th Nov 2021, 16:29"
	const dateWithTimeTwentyFourHours = (lastDigit, gmtTime) => {
		return dateWithYear(lastDigit, gmtTime) + ", " + twentyFourHours(gmtTime);
	}

	//conversationlist " '29th Jan' or Today/Yesterday"
	const shortTime = (lastDigit, gmtTime) => {
		let dateStr = "";
		if (lastDigit === 1) {
			dateStr = stampDate + "st";
		} else if (lastDigit === 2) {
			dateStr = stampDate + "nd";
		} else if (lastDigit === 3) {
			dateStr = stampDate + "rd";
		} else {
			dateStr = stampDate + "th";
		}
		return dateStr + " " + monthNames[gmtTime.getMonth()].slice(0, 3);
	}

	const conversationList = (lastDigit, gmtTime) => {
		let day = "";
		if (gmtTime.getMonth() === curGmtTime.getMonth() && gmtTime.getFullYear() === curGmtTime.getFullYear()) {
			if (gmtTime.getDate() === curGmtTime.getDate()) {
				day = "Today";
			} else if (gmtTime.getDate() + 1 === curGmtTime.getDate()) {
				day = "Yesterday";
			} else {
				day = shortTime(lastDigit, gmtTime);
			}
		} else {
			day = shortTime(lastDigit, gmtTime);
		}
		return day;
	}

	const setDate = () => {

		let messageDate = null;
		switch (props.timeFormat) {
			case "dd:mm:yyyy": {
				messageDate = dateWithYear(lastDigit, gmtTime);
				break;
			}
			case "hh:mm am/pm": {
				messageDate = twelveHours(gmtTime);
				break;
			}
			case "hh:mm": {
				messageDate = twentyFourHours(gmtTime);
				break;
			}
			case "dd:mm:yyyy,hh:mm am/pm": {
				messageDate = dateWithTimeTwelveHours(lastDigit, gmtTime);
				break;
			}
			case "dd:mm:yyyy,hh:mm": {
				messageDate = dateWithTimeTwentyFourHours(lastDigit, gmtTime);
				break;
			}
			case "dd:mm": {
				messageDate = conversationList(lastDigit, gmtTime);
				break;
			}
			case "days": {
				messageDate = getDays(gmtTime, curGmtTime);
				break;
			}
			default:
				break;
		}
		return messageDate;
	};

	return <span style={timeStyle(props)}>{setDate()}</span>;
}

CometChatDate.defaultProps = {
	timeStamp: 0,
	timeFont: "500 11px Inter,sans-serif",
	timeColor: "rgba(20, 20, 20, 40%)",
	timeFormat: "days",
	backgroundColor: "transparent",
	cornerRadius: null,
};

CometChatDate.propTypes = {
	timeStamp: PropTypes.number.isRequired,
	timeFont: PropTypes.string.isRequired,
	timeColor: PropTypes.string.isRequired,
	timeFormat: PropTypes.oneOf(["dd:mm:yyyy", "hh:mm am/pm", "hh:mm", "dd:mm:yyyy,hh:mm am/pm", "dd:mm:yyyy,hh:mm", "dd:mm", "days"]).isRequired,
	backgroundColor: PropTypes.string.isRequired,
	cornerRadius: PropTypes.string,
};

export { CometChatDate };