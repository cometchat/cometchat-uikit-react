import waitTick from "../../SecondaryComponents/CometChatMessageReceipt/resources/wait.svg";
import greyTick from "../../SecondaryComponents/CometChatMessageReceipt/resources/message-sent.svg";
import greyDoubleTick from "../../SecondaryComponents/CometChatMessageReceipt/resources/message-delivered.svg";
import blueDoubleTick from "../../SecondaryComponents/CometChatMessageReceipt/resources/message-read.svg";
import errorTick from "../../SecondaryComponents/CometChatMessageReceipt/resources/warning-small.svg";

const MessageReceiptConfiguration = function () {
	this.messageWaitIcon = waitTick;
	this.messageSentIcon = greyTick;
	this.messageDeliveredIcon = greyDoubleTick;
	this.messageReadIcon = blueDoubleTick;
	this.messageErrorIcon = errorTick;
};

export { MessageReceiptConfiguration };