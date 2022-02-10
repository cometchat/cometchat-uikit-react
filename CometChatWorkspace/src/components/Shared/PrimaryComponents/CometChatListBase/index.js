import * as React from "react";
import PropTypes from "prop-types";

import { CometChatLocalize } from "../";

import { 
    listBaseStyle,
    listBaseHeadStyle,
	listBaseNavStyle,
    backButtonStyle,
    listBaseTitleStyle,
    listBaseSearchStyle,
	listBaseSearchButtonStyle,
	listBaseSearchInputStyle,
    listBaseContainerStyle
} from "./style";

import searchIcon from "./resources/search.svg";
import backIcon from "./resources/back.svg";

/**
 * 
 * CometChatListBase is a component useful when presenting a list of items.
 * This component displays list of items, title, and supports style along with back button, and search and filtering of list items.
 * 
 * @version 1.0.0
 * @author CometChat
 * 
 */

const CometChatListBase = props => {

    const getBackButtonElem = () => {
        if (props.showBackButton) {
            return <div style={backButtonStyle(props)}></div>;
        }
        return null;
    };

	const onSearch = () => {


	}

    const getSearchElem = () => {

        if(!props.hideSearch) {

            return (
                <div style={listBaseSearchStyle(props)} className="listbase__search">
				    <button type="button" className="listbase__search__button" style={listBaseSearchButtonStyle(searchIcon, props)} ></button>
				    <input 
					type="text" 
					autoComplete="off" 
					style={listBaseSearchInputStyle(props)} 
					className="listbase__search__input" 
					placeholder={props.searchPlaceholder}
					dir={CometChatLocalize.getDir()}
					onChange={onSearch} />
			    </div>
            );
        }

        return null;
    }

	return (
		<div style={listBaseStyle(props)} className="cometchat__listbase" dir={CometChatLocalize.getDir()}>
			<div style={listBaseHeadStyle(props)} className="listbase__header">
				<div style={listBaseNavStyle(props)} className="listbase__nav">
					{getBackButtonElem()}
					<div style={listBaseTitleStyle(props)} className="listbase__title">
						{props.title}
					</div>
				</div>
				{getSearchElem()}
			</div>
			<div style={listBaseContainerStyle(props)} className="listbase__container">
				{props.children}
			</div>
		</div>
	);
};

CometChatListBase.propTypes = {
	/**  Width of the component  */
	width: PropTypes.string,
	/**  Height of the component  */
	height: PropTypes.string,
	/** Background of the component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
	background: PropTypes.string,
	/** This property sets the component's border. It sets the values of border-width, border-style, and border-color. */
	border: PropTypes.string,
	/** This property rounds the corners of an component's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
	cornerRadius: PropTypes.string,
	/** Title of the list */
	title: PropTypes.string,
	/** This property sets all the different properties of the component's font */
	titleFont: PropTypes.string,
	/** This property sets the foreground color value of the component's title text  */
	titleColor: PropTypes.string,
	/** Enable search */
	hideSearch: PropTypes.bool,
	/** This property sets the border of the search element. It sets the values of border-width, border-style, and border-color. */
	searchBorder: PropTypes.string,
	/** This property sets the background color of the search element  */
	searchBackground: PropTypes.string,
	/** This property rounds the corners of the search element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
	searchCornerRadius: PropTypes.string,
	/** This property sets the placeholder text of the search element. The placeholder is text shown when the input is empty  */
	searchPlaceholder: PropTypes.string,
	/** This property sets all the different properties of the search element's font */
	searchTextFont: PropTypes.string,
	/** This property sets the foreground color value of the search text  */
	searchTextColor: PropTypes.string,
	/** Enable back button */
	showBackButton: PropTypes.bool,
	/** URL for the back button icon */
	backIcon: PropTypes.string,
	/** Color of the back button icon */
	backIconTint: PropTypes.string,
	/** Callback function when a search text is entered */
	onSearch: PropTypes.func
};

CometChatListBase.defaultProps = {
	width: "100%",
	height: "100%",
	background: "white",
	border: "1px solid #808080",
	cornerRadius: "0",
	title: "Title",
	titleFont: "700 22px Inter, sans-serif",
	titleColor: "#141414",
	hideSearch: false,
	searchBackground: "rgba(#141414, 40%)",
	searchBorder: "none",
	searchCornerRadius: "8px",
	searchPlaceholder: "Search",
	searchTextFont: "400 15px Inter, sans-serif",
	searchTextColor: "#141414",
	showBackButton: false,
	backIcon: backIcon,
	backIconTint: "#3399FF",
	onSearch: () => {}
};

export { CometChatListBase };