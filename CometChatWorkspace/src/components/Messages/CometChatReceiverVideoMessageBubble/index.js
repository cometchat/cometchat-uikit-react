import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
	CometChatMessageActions,
	CometChatThreadedMessageReplyCount,
	CometChatReadReceipt,
} from "../";
import { CometChatMessageReactions } from "../Extensions";
import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../util/common";
import placeholderImage from "./resources/image_placeholder.png";
import { theme } from "../../../resources/theme";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageThumbnailStyle,
	messageDetailStyle,
	nameWrapperStyle,
	nameStyle,
	messageVideoContainerStyle,
	messageVideoWrapperStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle,
} from "./style";

class CometChatReceiverVideoMessageBubble extends React.Component {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);
		this._isMounted = false;

		this.state = {
			isHovering: false,
			thumbnailURL: placeholderImage
		};
	}
	componentDidMount() {
		this._isMounted = true;
		this.setImage();
	}
	componentWillUnmount(){
		this._isMounted = false;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (
			currentMessageStr !== nextMessageStr ||
			this.state.isHovering !== nextState.isHovering ||
			this.state.thumbnailURL !== nextState.thumbnailURL
		) {
			return true;
		}
		return false;
	}
	setImage = () => {
		const thumbnailGenerationData = checkMessageForExtensionsData(
			this.props.message,
			"thumbnail-generation"
		);
		if (thumbnailGenerationData) {
			const mq = window.matchMedia(this.props.theme.breakPoints[0]);

			mq.addListener(() => {
				const imageToDownload = this.chooseImage(thumbnailGenerationData);

				let img = new Image();
				img.src = imageToDownload;
				img.onload = () => {
					if (this._isMounted && this.state.thumbnailURL !== img.src) {
						this.setState({ thumbnailURL: img.src });
					}
				};
			});

			const imageToDownload = this.chooseImage(thumbnailGenerationData);
			this.downloadImage(imageToDownload)
				.then((response) => {
					let img = new Image();
					img.src = imageToDownload;
					img.onload = () => {
						if (this._isMounted && this.state.thumbnailURL !== img.src) {
							this.setState({ thumbnailURL: img.src });
						}
					};
				})
				.catch((error) => console.error(error));
		}
	};
	chooseImage = (thumbnailGenerationObject) => {
		const smallUrl = thumbnailGenerationObject["url_small"];
		const mediumUrl = thumbnailGenerationObject["url_medium"];

		const mq = window.matchMedia(this.props.theme.breakPoints[0]);

		let imageToDownload = mediumUrl;
		if (mq.matches) {
			imageToDownload = smallUrl;
		}

		return imageToDownload;
	};



	downloadImage(imgUrl) {
		const promise = new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", imgUrl, true);
			xhr.responseType = "blob";

			xhr.onload = () => {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						this.timer = null;
						resolve(imgUrl);
					} else if (xhr.status === 403) {
						this.timer = setTimeout(() => {
							this.downloadImage(imgUrl)
								.then((response) => resolve(imgUrl))
								.catch((error) => reject(error));
						}, 800);
					}
				} else {
					reject(xhr.statusText);
				}
			};

			xhr.onerror = (event) =>
				reject(new Error("There was a network error.", event));
			xhr.ontimeout = (event) =>
				reject(new Error("There was a timeout error.", event));
			xhr.send();
		});

		return promise;
	}

	handleMouseHover = () => {
		this.setState(this.toggleHoverState);
	};

	toggleHoverState = (state) => {
		return {
			isHovering: !state.isHovering,
		};
	};

	render() {
		let avatar = null,
			name = null;
		if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
			avatar = (
				<div css={messageThumbnailStyle()} className='message__thumbnail'>
					<CometChatAvatar user={this.props.message.sender} />
				</div>
			);

			name = (
				<div css={nameWrapperStyle(avatar)} className='message__name__wrapper'>
					<span css={nameStyle(this.context)} className='message__name'>
						{this.props.message.sender.name}
					</span>
				</div>
			);
		}

		let messageReactions = null;
		const reactionsData = checkMessageForExtensionsData(
			this.props.message,
			"reactions"
		);
		if (reactionsData) {
			if (Object.keys(reactionsData).length) {
				messageReactions = (
					<div
						css={messageReactionsWrapperStyle()}
						className='message__reaction__wrapper'
					>
						<CometChatMessageReactions
							message={this.props.message}
							actionGenerated={this.props.actionGenerated}
						/>
					</div>
				);
			}
		}

		let toolTipView = null;
		if (this.state.isHovering) {
			toolTipView = (
				<CometChatMessageActions
					message={this.props.message}
					actionGenerated={this.props.actionGenerated}
				/>
			);
		}

		return (
			<div
				css={messageContainerStyle()}
				className='receiver__message__container message__video'
				onMouseEnter={this.handleMouseHover}
				onMouseLeave={this.handleMouseHover}
			>
				<div css={messageWrapperStyle()} className='message__wrapper'>
					{avatar}
					<div css={messageDetailStyle(name)} className='message__details'>
						{name}
						{toolTipView}
						<div
							css={messageVideoContainerStyle()}
							className='message__video__container'
						>
							<div
								css={messageVideoWrapperStyle()}
								className='message__video__wrapper'
							>
								<video controls poster={this.state?.thumbnailURL}>
									<source src={this.props.message.data.attachments[0].url} />
								</video>
							</div>
						</div>

						{messageReactions}

						<div
							css={messageInfoWrapperStyle()}
							className='message__info__wrapper'
						>
							<CometChatReadReceipt message={this.props.message} />
							<CometChatThreadedMessageReplyCount
								message={this.props.message}
								actionGenerated={this.props.actionGenerated}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatReceiverVideoMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatReceiverVideoMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatReceiverVideoMessageBubble };
