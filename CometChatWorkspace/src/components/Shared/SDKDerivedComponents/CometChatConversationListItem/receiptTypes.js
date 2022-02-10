import blueDoubleTick from "./resources/last-message-read.svg";
import greyDoubleTick from "./resources/last-message-delivered.svg";
import greyTick from "./resources/last-message-sent.svg";
import sendingTick from "./resources/last-message-wait.svg";
import errorTick from "./resources/last-message-error.svg";

export const receiptTypes = {
	error: errorTick,
	sending: sendingTick,
	sent: greyTick,
	delivered: greyDoubleTick,
	read: blueDoubleTick,
};
