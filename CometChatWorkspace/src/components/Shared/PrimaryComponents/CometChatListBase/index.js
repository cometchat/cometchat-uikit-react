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
  listBaseContainerStyle,
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

const CometChatListBase = (props) => {
  const getBackButtonElem = () => {
    if (!props.showBackButton) {
      return <div style={backButtonStyle(props)}></div>;
    }
    return null;
  };

  const searchHandler = (e) => {
    props.onSearch(e.target.value);
  };

  const onSearch = (e) => {
    setTimeout(searchHandler(e), 500);
  };

  const getSearchElem = () => {
    if (!props.hideSearch) {
      return (
        <div style={listBaseSearchStyle(props)} className='listbase__search'>
          <button
            type='button'
            className='listbase__search__button'
            style={listBaseSearchButtonStyle(props)}
          ></button>
          <input
            type='text'
            autoComplete='off'
            style={listBaseSearchInputStyle(props)}
            className='listbase__search__input'
            placeholder={props.searchPlaceholder}
            dir={CometChatLocalize.getDir()}
            onChange={onSearch}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={listBaseStyle(props)}
      className='cometchat__listbase'
      dir={CometChatLocalize.getDir()}
    >
      <div style={listBaseHeadStyle(props)} className='listbase__header'>
        <div style={listBaseNavStyle(props)} className='listbase__nav'>
          {getBackButtonElem()}
          <div style={listBaseTitleStyle(props)} className='listbase__title'>
            {props.title}
          </div>
        </div>
        {getSearchElem()}
      </div>
      <div
        style={listBaseContainerStyle(props)}
        className='listbase__container'
      >
        {props.children}
      </div>
    </div>
  );
};

CometChatListBase.defaultProps = {
  title: "Title",
  searchPlaceholder: "Search",
  onSearch: () => {}, //callback func
  style: {
    width: "100%",
    height: "100%",
    border: "1px solid #808080",
    cornerRadius: "8px",
    background: "rgba(20,20,20,0.04)",
    titleFont: "700 22px Inter, sans-serif",
    titleColor: "#141414",
    backIconTint: "#399fff",
    searchBorder: "1px solid #141414",
    searchCornerRadius: "8px",
    searchBackground: "rgba(20,20,20,0.04)",
    searchTextFont: "400 15px Inter, sans-serif",
    searchTextColor: "#141414",
    searchIconTint: "#399fff",
  },
  backButtonIconURL: backIcon,
  searchIconURL: searchIcon,
  showBackButton: true,
  hideSearch: false,
};

CometChatListBase.propTypes = {
  /** Callback function when a search text is entered */
  title: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  style: PropTypes.object,
  /** Enable search */
  hideSearch: PropTypes.bool,
  /** Enable back button */
  showBackButton: PropTypes.bool,
  backButtonIconURL: PropTypes.string,
  searchIconURL: PropTypes.string,
};

export { CometChatListBase };
