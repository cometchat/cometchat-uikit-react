import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { AddMembersManager } from "./controller";

import { CometChatAddGroupMemberListItem } from "../";
import { CometChatBackdrop } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalCaptionStyle,
    modalSearchStyle,
    searchButtonStyle,
    searchInputStyle,
    modalListStyle,
    modalFootStyle,
    contactMsgStyle,
    contactMsgTxtStyle,
    modalErrorStyle
} from "./style";

import addingIcon from "./resources/adding.svg";
import searchIcon from "./resources/search.svg";
import clearIcon from "./resources/close.svg";

class CometChatAddGroupMemberList extends React.Component {

    static contextType = CometChatContext;

    constructor(props, context) {
        super(props, context);

        this.state = {
            userlist: [],
            membersToAdd: [],
            filteredlist: [],
            addingMembers: false,
            decoratorMessage: Translator.translate("LOADING", context.language),
            errorMessage: ""
        }
    }

    componentDidMount() {

        this.AddMembersManager = new AddMembersManager(this.context);
        this.AddMembersManager.initializeMembersRequest().then(() => {

            this.getUsers();
            this.AddMembersManager.attachListeners(this.userUpdated);
        });
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

            let userObj = userlist[userKey];
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
        
        this.AddMembersManager = new AddMembersManager(this.context, val);
        this.AddMembersManager.initializeMembersRequest().then(() => {

            this.timeout = setTimeout(() => {
                this.setState({ userlist: [], membersToAdd: [], membersToRemove: [], filteredlist: [], decoratorMessage: Translator.translate("LOADING", this.context.language) }, () => this.getUsers());
            }, 500);
							
        });
    }
  
    getUsers = () => {
  
        this.AddMembersManager.fetchNextUsers()
            .then(userList => {
                const filteredUserList = userList.filter(user => {
                    const found = this.context.groupMembers.find(member => user.uid === member.uid);
                    const foundbanned = this.context.bannedGroupMembers.find(member => user.uid === member.uid);
                    if (found || foundbanned) {
                        return false;
                    }
                    return true;
                });

                if (filteredUserList.length === 0) {
                    this.setState({ decoratorMessage: Translator.translate("NO_USERS_FOUND", this.context.language) });
                }

                this.setState({ userlist: [...this.state.userlist, ...userList], filteredlist: [...this.state.filteredlist, ...filteredUserList] });
            })
            .catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) }));
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
        
        const guid = this.context.item.guid;
        const membersList = [];

        this.state.membersToAdd.forEach(newmember => {
            //if a selected member is already part of the member list, don't add
            const IndexFound = this.context.groupMembers.findIndex(member => member.uid === newmember.uid);
            if(IndexFound === -1) {
                
                const newMember = new CometChat.GroupMember(newmember.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
                membersList.push(newMember);

                newmember["type"] = "add";
            }
        });

        if(membersList.length) {

            this.setState({ addingMembers: true });

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

                    this.props.actionGenerated(enums.ACTIONS["ADD_GROUP_MEMBER_SUCCESS"], membersToAdd);
                }
                this.setState({ addingMembers: false });
                this.props.close();

            }).catch(error => {
                
                this.setState({ addingMembers: false, errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) });
                
            });
        }
    }

    render() {

        const createText = this.state.addingMembers ? Translator.translate("ADDING", this.context.language) : Translator.translate("ADD", this.context.language);
        let addGroupMemberBtn = (
            <div css={modalFootStyle(this.props, this.state, addingIcon, this.context)} className="modal__addmembers">
                <button type="button" onClick={this.updateMembers}><span>{createText}</span></button>
            </div>
        );

        let messageContainer = null;
        if (this.state.filteredlist.length === 0) {

            messageContainer = (
                <div css={contactMsgStyle()} className="members__decorator-message">
                    <p css={contactMsgTxtStyle(this.context)} className="decorator-message">{this.state.decoratorMessage}</p>
                </div>
            );
            addGroupMemberBtn = null;
        }

        let currentLetter = "";
        const filteredUserList = [...this.state.filteredlist];
        const users = filteredUserList.map(user => {

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
                    firstLetter={firstLetter}
                    user={user}
                    changed={this.membersUpdated} />
                </React.Fragment>
            )
        });

        return (
            <React.Fragment>
                <CometChatBackdrop show={true} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.context)} className="modal__addmembers">
                    <span css={modalCloseStyle(clearIcon, this.context)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.context.language)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <div css={modalCaptionStyle(Translator.getDirection(this.context.language))} className="modal__title">{Translator.translate("USERS", this.context.language)}</div>
                        <div css={modalErrorStyle(this.context)} className="modal__error">{this.state.errorMessage}</div>
                        <div css={modalSearchStyle()} className="modal__search">
                            <button type="button" className="search__button" css={searchButtonStyle(searchIcon, this.context)} />
                            <input
                            type="text"
                            autoComplete="off"
                            css={searchInputStyle()}
                            className="search__input"
                            placeholder={Translator.translate("SEARCH", this.context.language)}
                            onChange={this.searchUsers} />
                        </div>
                        {messageContainer}
                        <div css={modalListStyle(this.context)} onScroll={this.handleScroll} className="modal__content">{users}</div>
                        {addGroupMemberBtn}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

// Specifies the default values for props:
CometChatAddGroupMemberList.defaultProps = {
    theme: theme
};

CometChatAddGroupMemberList.propTypes = {
    theme: PropTypes.object
}

export { CometChatAddGroupMemberList };
