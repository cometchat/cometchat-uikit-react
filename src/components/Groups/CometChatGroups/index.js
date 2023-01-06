import React from "react";
import PropTypes from "prop-types";

import {
  CometChatListBase,
  CometChatGroupList,
  localize,
  CometChatTheme,
  CometChatPopover,
} from "../..";

import { CometChatGroupEvents } from "../..";
import { GroupListConfiguration } from "../../Groups/CometChatGroupList/GroupListConfiguration";

import { CreateGroupConfiguration } from "../../Groups/CometChatCreateGroup/CreateGroupConfiguration";

import {
  containerStyle,
  createGroupBtnStyle,
  popOverForCreateGroup,
  getListBaseStyle,
  getListStyle,
  getCreateGroupStyle,
} from "./style";

import { CometChatCreateGroup } from "../CometChatCreateGroup";

/**
 *
 * CometChatGroups is a container component that wraps and
 * formats CometChatListBase and CometChatGroupList component, with no behavior of its own.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const Groups = React.forwardRef((props, ref) => {
  /**
   * Destructuring Props
   */
  const {
    title,
    searchPlaceholder,
    activeGroup,
    style,
    createGroupIconURL,
    backButtonIconURL,
    searchIconURL,
    showBackButtonURL,
    hideCreateGroup,
    hideSearch,
    groupListConfiguration,
    createGroupConfiguration,
    theme,
  } = props;

  /**
   * Component internal state
   */
  const groupListRef = React.useRef(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [viewCreateGroup, setViewCreateGroup] = React.useState(false);

  const _theme = new CometChatTheme(theme || {});
  const _groupListConfiguration =
    groupListConfiguration || new GroupListConfiguration({});

  const _createGroupConfiguration =
    createGroupConfiguration || new CreateGroupConfiguration({});

  /**
   * Public methods
   */
  React.useImperativeHandle(ref, () => ({
    groupListRef: groupListRef.current,
  }));

  /**
   * Triggers addGroup method og groupList
   * @param {*} group
   */
  const updateGroup = (group) => {
    if (groupListRef?.current) {
      groupListRef.current.addGroup(group);
    }
  };

  /**
   * Listener when Group is created successfully
   */
  CometChatGroupEvents.addListener(
    CometChatGroupEvents.onGroupCreate,
    "onGroupCreate",
    updateGroup
  );

  /**
   * Action to be performed when clicked on close icon of create group modal
   */
  const closeCreateGroup = () => {
    setViewCreateGroup(false);
  };

  /**
   * Action to be performed when clicked on create Group icon
   */
  const openCreateGroup = () => {
    setViewCreateGroup(true);
  };

  /**
   *
   * @returns Create Group Modal View
   */
  const showCreateGroup = () => {
    return viewCreateGroup ? (
      <CometChatPopover
        withBackDrop={viewCreateGroup ? true : false}
        style={popOverForCreateGroup(_theme, _createGroupConfiguration)}
      >
        <CometChatCreateGroup
          title={localize("NEW__GROUP")}
          namePlaceholderText={localize("ENTER_GROUP_NAME")}
          passwordPlaceholderText={localize("ENTER_GROUP_PASSWORD")}
          createGroupButtonText={localize("CREATE_GROUP")}
          onClose={_createGroupConfiguration.onClose || closeCreateGroup}
          onCreateGroup={_createGroupConfiguration.onCreateGroup}
          hideCloseButton={_createGroupConfiguration.hideCloseButton}
          closeButtonIconURL={_createGroupConfiguration.closeButtonIconURL}
          style={getCreateGroupStyle(_createGroupConfiguration, _theme)}
        />
      </CometChatPopover>
    ) : null;
  };

  /**
   *
   * @returns Create group button
   */
  const getCreateGroupButtonElem = () => {
    if (!hideCreateGroup) {
      return (
        <div
          onClick={openCreateGroup.bind(this)}
          style={createGroupBtnStyle(style, createGroupIconURL, _theme)}
        ></div>
      );
    }
    return null;
  };

  /**
   * Handles search
   * @param {*} searchText
   */
  const searchHandler = (searchText) => {
    setSearchInput(searchText);
  };

  /**
   * Component Level Return
   */
  return (
    <div style={containerStyle(style)} className="cometchat__groups">
      {getCreateGroupButtonElem()}
      <CometChatListBase
        title={title}
        searchPlaceholder={searchInput ? searchInput : searchPlaceholder}
        onSearch={searchHandler}
        style={getListBaseStyle(style, _theme)}
        searchIconURL={searchIconURL}
        showBackButton={showBackButtonURL}
        hideSearch={hideSearch}
        backButtonIconURL={backButtonIconURL}
      >
        <CometChatGroupList
          ref={groupListRef}
          limit={_groupListConfiguration.limit}
          searchKeyword={
            searchInput ? searchInput : _groupListConfiguration.searchKeyword
          }
          joinedOnly={_groupListConfiguration.joinedOnly}
          tags={_groupListConfiguration.tags}
          style={getListStyle(_groupListConfiguration, _theme)}
          customView={_groupListConfiguration.customView}
          loadingIconURL={_groupListConfiguration.loadingIconURL}
          emptyText={localize("NO_GROUPS_FOUND")}
          errorText={localize("SOMETHING_WENT_WRONG")}
          hideError={_groupListConfiguration.hideError}
          activeGroup={activeGroup}
          dataItemConfiguration={_groupListConfiguration.dataItemConfiguration}
        />
      </CometChatListBase>
      {showCreateGroup()}
    </div>
  );
});

/**
 * Default Props
 */
Groups.defaultProps = {
  title: "Groups",
  searchPlaceholder: "Search",
  activeGroup: null,
  style: {
    width: "",
    height: "",
    border: "",
    cornerRadius: "",
    background: "",
    titleFont: "",
    titleColor: "",
    backIconTint: "",
    createGroupIconTint: "",
    searchBorder: "",
    searchBorderRadius: "",
    searchBackground: "",
    searchTextFont: "",
    searchTextColor: "",
    searchIconTint: "",
  },
  createGroupIconURL: null,
  backButtonIconURL: null,
  searchIconURL: null,
  showBackButton: false,
  hideCreateGroup: false,
  hideSearch: false,
  groupListConfiguration: null,
  createGroupConfiguration: null,
};

/**
 * Props Types
 */
Groups.propTypes = {
  title: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  activeGroup: PropTypes.object,
  style: PropTypes.object,
  createGroupIconURL: PropTypes.string,
  backButtonIconURL: PropTypes.string,
  searchIconURL: PropTypes.string,
  showBackButton: PropTypes.bool,
  hideCreateGroup: PropTypes.bool,
  hideSearch: PropTypes.bool,
  groupListConfiguration: PropTypes.object,
  createGroupConfiguration: PropTypes.object,
};

export const CometChatGroups = React.memo(Groups);
