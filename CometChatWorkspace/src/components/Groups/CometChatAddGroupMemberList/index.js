import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { AddMembersManager } from "./controller";

import { CometChatAddGroupMemberListItem } from "../";
import GroupDetailContext from "../CometChatGroupDetails/context";
import { CometChatBackdrop } from "../../Shared";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalCaptionStyle,
    modalSearchStyle,
    searchInputStyle,
    modalListStyle,
    modalFootStyle,
    contactMsgStyle,
    contactMsgTxtStyle,
} from "./style";

import searchIcon from "./resources/search-grey-icon.png";
import clearIcon from "./resources/close.png";

class CometChatAddGroupMemberList extends React.Component {

    decoratorMessage = Translator.translate("LOADING", Translator.getDefaultLanguage());
    static contextType = GroupDetailContext;

    constructor(props) {
        super(props);
        this.state = {
            userlist: [],
            membersToAdd: [],
            filteredlist: [],
        }
    }

    componentDidMount() {
  
        if(this.props?.friendsOnly) {
            this.friendsOnly = this.props.friendsOnly;
        }

        this.AddMembersManager = new AddMembersManager(this.friendsOnly);
        this.getUsers();
        this.AddMembersManager.attachListeners(this.userUpdated);
    }

    componentWillUnmount() {

        this.AddMembersManager.removeListeners();
        this.AddMembersManager = null;
    }

    userUpdated = (user) => {
        
        let userlist = [...this.state.userlist];
  
        //search for user
        let userKey = userlist.findIndex((u, k) => u.uid === user.uid);
      
        //if found in the list, update user object
        if(userKey > -1) {

            let userObj = userlist[userKey];//{...userlist[userKey]};
            let newUserObj = Object.assign({}, userObj, user);
            userlist.splice(userKey, 1, newUserObj);
    
            this.setState({ userlist: userlist });
        }
    }

    handleScroll = (e) => {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
      if (bottom) this.getUsers();
    }
    
    searchUsers = (e) => {
  
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        let val = e.target.value;
        this.timeout = setTimeout(() => {

        this.AddMembersManager = new AddMembersManager(this.friendsOnly, val);
            this.setState({ userlist: [], membersToAdd: [], membersToRemove: [], filteredlist: [] }, () => this.getUsers())
        }, 500);
  
    }
  
    getUsers = () => {
  
        CometChat.getLoggedinUser().then((user) => {
  
            this.AddMembersManager.fetchNextUsers().then(userList => {

                const filteredUserList = userList.filter(user => {

                    const found = this.context.memberlist.find(member => user.uid === member.uid);
                    const foundbanned = this.context.bannedmemberlist.find(member => user.uid === member.uid);
                    if (found || foundbanned) {
                        return false;
                    }
                    return true;
                });

                if (filteredUserList.length === 0) {
                    this.decoratorMessage = Translator.translate("NO_USERS_FOUND", this.props.lang);
                }

                this.setState({ userlist: [...this.state.userlist, ...userList], filteredlist: [...this.state.filteredlist, ...filteredUserList] });
                
            }).catch((error) => {

                this.decoratorMessage = Translator.translate("ERROR", this.props.lang);
                console.error("[CometChatAddMembers] getUsers fetchNext error", error);
            });
  
        }).catch((error) => {

            this.decoratorMessage = Translator.translate("ERROR", this.props.lang);
            console.log("[CometChatAddMembers] getUsers getLoggedinUser error", error);
        });
    }

    membersUpdated = (user, userState) => {

        if(userState) {

            const members = [...this.state.membersToAdd];
            members.push(user);
            this.setState({membersToAdd: [...members]});

        } else {

            const membersToAdd = [...this.state.membersToAdd];
            const IndexFound = membersToAdd.findIndex(member => member.uid === user.uid);
            if(IndexFound > -1) {
                membersToAdd.splice(IndexFound, 1);
                this.setState({membersToAdd: [...membersToAdd]})
            }
        }
    }

    updateMembers = () => {
        
        const group = this.context;

        const guid = this.props.item.guid;
        const membersList = [];

        this.state.membersToAdd.forEach(newmember => {
            //if a selected member is already part of the member list, don't add
            const IndexFound = group.memberlist.findIndex(member => member.uid === newmember.uid);
            if(IndexFound === -1) {
                
                const newMember = new CometChat.GroupMember(newmember.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
                membersList.push(newMember);

                newmember["type"] = "add";
            }
        });

        if(membersList.length) {

            const membersToAdd = [];
            CometChat.addMembersToGroup(guid, membersList, []).then(response => {

                if (Object.keys(response).length) {
                        
                    for (const member in response) {

                        if(response[member] === "success") {

                            const found = this.state.userlist.find(user => user.uid === member);
                            found["scope"] = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
                            membersToAdd.push(found);
                        }
                    }
                    this.props.actionGenerated("addGroupParticipants", membersToAdd);
                }
                this.props.close();

            }).catch(error => {
                console.log("addMembersToGroup failed with exception:", error);
            });
        }
    }

    render() {

        const group = this.context;

        let messageContainer = null;
        if (this.state.filteredlist.length === 0) {

            messageContainer = (
                <div css={contactMsgStyle()} className="members__decorator-message">
                    <p css={contactMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
                </div>
            );
        }

        let currentLetter = "";
        const filteredUserList = [...this.state.filteredlist];
        const users = filteredUserList.map((user, key) => {

            const chr = user.name[0].toUpperCase();
            let firstLetter = null;
            if(chr !== currentLetter) {
                currentLetter = chr;
                firstLetter = currentLetter;
            }

            return (
                <React.Fragment key={user.uid}>
                    <CometChatAddGroupMemberListItem 
                    theme={this.props.theme}
                    lang={this.props.lang}
                    firstLetter={firstLetter}
                    loggedinuser={group.loggedinuser}
                    user={user}
                    members={group.memberlist}
                    changed={this.membersUpdated}
                    widgetsettings={this.props.widgetsettings} />
                </React.Fragment>
            )
        });

        return (
            <React.Fragment>
                <CometChatBackdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)} className="modal__addmembers">
                    <span css={modalCloseStyle(clearIcon)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.props.lang)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <div css={modalCaptionStyle(Translator.getDirection(this.props.lang))} className="modal__title">{Translator.translate("USERS", this.props.lang)}</div>
                        <div css={modalSearchStyle()} className="modal__search">
                            <input
                            type="text"
                            autoComplete="off"
                            css={searchInputStyle(this.props, searchIcon)}
                            className="search__input"
                            placeholder={Translator.translate("SEARCH", this.props.lang)}
                            onChange={this.searchUsers} />
                        </div>
                        {messageContainer}
                        <div css={modalListStyle(this.props)} onScroll={this.handleScroll} className="modal__content">{users}</div>
                        <div css={modalFootStyle(this.props)} className="modal__addmembers">
                            <button type="button" onClick={this.updateMembers}>{Translator.translate("ADD", this.props.lang)}</button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

// Specifies the default values for props:
CometChatAddGroupMemberList.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatAddGroupMemberList.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatAddGroupMemberList;