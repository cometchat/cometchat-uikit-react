import React from "react";
import PropTypes from "prop-types";
import { Emojis } from "./emojis";
import { CometChatEmojiCategory } from "./EmojiCategory";
import { CometChatEmoji } from "./Emoji";

import {
	emojiListStyle,
	emojiCategoryWrapper,
	emojiCategoryTitle,
	emojiTabLsitStyle,
	emojiContainerStyle,
	getListStyle,
	listStyle,
} from "./style";

import { CometChatListItem } from "../../Shared";

/**
 *
 * CometChatEmojiKeyboard is a component that fetch emoji from emjis file and displays emoji
 * in the CometChatListItem component.
 *
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatEmojiKeyboard = (props) => {
	const categoryRef = React.useRef([]);
	const handleEvent = (obj) => {
		props.onClick(obj);
	};

	const autoScrollView = (id) => {
		categoryRef.current[id].scrollIntoView(true);
	};

	const renderItems = () => {
		let emojiJSX = null;
		let emojiCategoryJSX = [];
		let renderId = null;
		emojiJSX = Emojis?.map((el, i) => {
			const vals = Object?.values(el)[0];
			renderId = Math.floor(Math.random() * (Emojis?.length - 0) + i);
			/**Each json iteration filter through EmojiCategory class */
			const emojiCategory = new CometChatEmojiCategory({
				id: vals.id,
				name: vals.name,
				symbol: vals.symbol,
				emojis: vals.emojis,
			});
			/**Emoji Category List */
			emojiCategoryJSX.push(
				<div key={emojiCategory.id} className='emoji__autoscroll'>
					<CometChatListItem
						key={emojiCategory.id}
						id={emojiCategory.id}
						iconURL={emojiCategory.symbol}
						style={getListStyle()}
						onItemClick={autoScrollView.bind(this, emojiCategory.id)}
					/>
				</div>
			);

			const title = (
				<p className='emoji__category__title' style={emojiCategoryTitle(props)} ref={(el) => (categoryRef.current[emojiCategory.id] = el)}>
					{emojiCategory.name}
				</p>
			);

			/**Emojis List */
			let emojiList = null;
			emojiList = Object?.values(emojiCategory?.emojis)?.map((emoji, i) => {
				let emojiId = Math.floor(
					Math.random() * (Object?.values?.length - 0) + i
				);
				const emojiInstance = new CometChatEmoji({
					char: emoji.char,
					keywords: emoji.keywords,
				});

				return (
					<CometChatListItem
						id={String(emojiId)}
						key={emojiId}
						onItemClick={handleEvent.bind(this, emojiInstance)}
						style={listStyle(props)}
						text={emojiInstance.char}
					/>
				);
			});
			return (
				<div
					key={emojiCategory.id}
					id={emojiCategory.id} // for auto scroll
					className='emoji__category__wrapper'
					style={emojiCategoryWrapper(props)}
				>
					{title}
					<div className='emoji__list' style={emojiListStyle(props)}>
						{emojiList}
					</div>
				</div>
			);
		});

		return (
			<div className='emoji__keyboard' style={emojiContainerStyle(props)}>
				<div className='emoji__list__items'>{emojiJSX}</div>
				<div className='emoji__category' style={emojiTabLsitStyle(props)}>
					{emojiCategoryJSX}
				</div>
			</div>
		);
	};

	return renderItems();
};

// Specifies the default values for props:
CometChatEmojiKeyboard.defaultProps = {
	hideSearch: false,
	onClick: () => {},
	style: {
		width: "100%",
		height: "250px",
		border: "none",
		background: "rgb(255,255,255)",
		borderRadius: "8px",
		sectionHeaderFont: "500 12px Inter, sans-serif",
		sectionHeaderColor: "rgba(20,20,20,0.58)",
		categoryIconTint: "RGBA(20, 20, 20, 0.58)",
		selectedCategoryIconTint: "#39f",
	},
};

CometChatEmojiKeyboard.propTypes = {
	hideSearch: PropTypes.bool,
	onClick: PropTypes.func,
	style: PropTypes.object,
};

export { CometChatEmojiKeyboard };
