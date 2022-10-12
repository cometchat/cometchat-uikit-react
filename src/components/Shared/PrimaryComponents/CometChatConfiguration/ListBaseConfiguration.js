import { ListBaseStyles } from "../CometChatListBase/ListBaseStyles";

/**
 * @class ListBaseConfiguration
 * @param {String} title
 * @param {String} searchPlaceholder
 * @param {String} backButtonIconURL
 * @param {String} searchIconURL
 * @param {Boolean} showBackButton
 * @param {Boolean} hideSearch
 * @param {String} searchText
 * @param {Function} onSearch
 * @param {Function} onBackButtonClick
 * @param {Object} style
 */
class ListBaseConfiguration {
	constructor({
		title = "Title",
		searchPlaceholder = "Search",
		onSearch = () => { },
		onBackButtonClick = () => { },
		backButtonIconURL = "",
		searchIconURL = "",
		showBackButton = true,
		hideSearch = true,
		searchText = "",
		style = new ListBaseStyles({})
	}) {
		this.title = title;
		this.searchPlaceholder = searchPlaceholder;
		this.onSearch = onSearch;
		this.onBackButtonClick = onBackButtonClick;
		this.backButtonIconURL = backButtonIconURL;
		this.searchIconURL = searchIconURL;
		this.showBackButton = showBackButton;
		this.hideSearch = hideSearch;
		this.searchText = searchText;
		this.style = new ListBaseStyles(style ?? {});
	}
}

export { ListBaseConfiguration };