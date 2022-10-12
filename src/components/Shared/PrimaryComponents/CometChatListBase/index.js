import * as React from "react";
import PropTypes from "prop-types";
import {
    CometChatLocalize,
    ListBaseConfiguration,
    CometChatTheme
} from "../../../../";
import * as styles from "./style";
import searchIcon from "./resources/search.svg";
import backIcon from "./resources/back.svg";

/**
 *
 * @version 1.0.0
 * @author CometChat
 * @description CometChatListBase is a component useful when presenting a list of items.
 * This component displays list of items, title, and supports style along with back button, and search and filtering of list items.
 * 
 */

const CometChatListBase = (props) => {

    /**
     * Props destructuring
     */
    const {
        title,
        searchPlaceholder,
        onSearch,
        onBackButtonClick,
        style,
        backButtonIconURL,
        searchIconURL,
        showBackButton,
        hideSearch,
        searchText,
        theme,
    } = props;

    /**
     * Component private scoping
     */
    const defaultConfig = new ListBaseConfiguration({});
    const _title = title ?? defaultConfig?.title;
    const _searchPlaceholder = searchPlaceholder ?? defaultConfig?.searchPlaceholder;
    const _onSearch = onSearch ?? defaultConfig?.onSearch;
    const _onBackButtonClick = onBackButtonClick ?? defaultConfig?.onBackButtonClick;
    const _style = style ?? defaultConfig?.style;
    const _backButtonIconURL = backButtonIconURL ?? defaultConfig?.backButtonIconURL;
    const _searchIconURL = searchIconURL ?? defaultConfig?.searchIconURL;
    const _showBackButton = showBackButton ?? defaultConfig?.showBackButton;
    const _hideSearch = hideSearch ?? defaultConfig?.hideSearch;
    const _searchText = searchText ?? defaultConfig?.searchText;
    const _theme = new CometChatTheme(theme ??  {});;

    /**
     * Component internal handlers/methods 
     */
    const searchHandler = (e) => {
        setTimeout(_onSearch(e.target.value ?? _searchText), 500);
    };

    /**
     * Component template scoping
     */
    const getBackButtonElem = () => {
        if (_showBackButton) {
            return <div style={styles.backButtonStyle(_style, _theme, _showBackButton, _backButtonIconURL)} onClick={_onBackButtonClick.bind(this)}></div>;
        }
        return null;
    };

    const getSearchElem = () => {
        if (!_hideSearch) {
            return (
                <div style={styles.listBaseSearchStyle(_style, _theme)} className='listbase__search'>
                    <button
                        type='button'
                        className='listbase__search__button'
                        style={styles.listBaseSearchButtonStyle(_style, _theme, _searchIconURL)}
                    ></button>
                    <input
                        type='text'
                        autoComplete='off'
                        style={styles.listBaseSearchInputStyle(_style, _theme)}
                        className='listbase__search__input'
                        placeholder={_searchPlaceholder}
                        dir={CometChatLocalize.getDir()}
                        onChange={searchHandler.bind(this)}
                    />
                </div>
            );
        }

        return null;
    };

    /**
     * Component template
     */
    return (
        <div
            style={styles.listBaseStyle(_style, _theme)}
            className='cometchat__listbase'
            dir={CometChatLocalize.getDir()}
        >
            <div style={styles.listBaseHeadStyle(_style, _hideSearch)} className='listbase__header'>
                <div style={styles.listBaseNavStyle(_style)} className='listbase__nav'>
                    {getBackButtonElem()}
                    <div style={styles.listBaseTitleStyle(_style, _theme)} className='listbase__title'>
                        {_title}
                    </div>
                </div>
                {getSearchElem()}
            </div>
            <div
                style={styles.listBaseContainerStyle(_style, _hideSearch)}
                className='listbase__container'
            >
                {props.children}
            </div>
        </div>
    );
};


/**
 * Component default props
 */
CometChatListBase.defaultProps = {
    backButtonIconURL: backIcon,
    searchIconURL: searchIcon,
};

/**
 * Component default props types
 */
CometChatListBase.propTypes = {
    title: PropTypes.string,
    searchPlaceholder: PropTypes.string,
    onSearch: PropTypes.func,
    onBackButtonClick: PropTypes.func,
    style: PropTypes.object,
    hideSearch: PropTypes.bool,
    showBackButton: PropTypes.bool,
    backButtonIconURL: PropTypes.string,
    searchIconURL: PropTypes.string,
    searchText: PropTypes.string,
    theme: PropTypes.object,
};

export { CometChatListBase };
