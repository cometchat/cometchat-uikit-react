import React from "react";
import classNames from "classnames";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import { AddMembersManager } from "./controller";

import AddMemberView from "../AddMemberView";
import Backdrop from '../Backdrop';

import GroupDetailContext from '../CometChatGroupDetail/context';

import "./style.scss";

class CometChatAddMembers extends React.Component {

    static contextType = GroupDetailContext;

    constructor(props) {
        super(props);
        this.state = {
            userlist: [],
            membersToAdd: []
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
            this.setState({ userlist: [], membersToAdd: [], membersToRemove: [] }, () => this.getUsers())
        }, 500);
  
    }
  
    getUsers = () => {
  
        new CometChatManager().getLoggedInUser().then((user) => {
  
            this.AddMembersManager.fetchNextUsers().then((userList) => {
            
            userList.forEach(user => user = this.setAvatar(user));
            this.setState({ userlist: [...this.state.userlist, ...userList] });
                
            }).catch((error) => {
                console.error("[CometChatAddMembers] getUsers fetchNext error", error);
            });
  
        }).catch((error) => {
            console.log("[CometChatAddMembers] getUsers getLoggedInUser error", error);
        });
    }
  
    setAvatar(user) {
  
      if(!user.getAvatar()) {
        const uid = user.getUid();
        const char = user.getName().charAt(0).toUpperCase();
        user.setAvatar(SvgAvatar.getAvatar(uid, char))
      }
  
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

        const userList = [...this.state.userlist];

        const filteredUserList = userList.filter(user => {

            const found = group.memberlist.find(member => user.uid === member.uid);
            const foundbanned = group.bannedmemberlist.find(member => user.uid === member.uid);
            if(found || foundbanned) {
                return false;
            }
            return true;
        });

        let currentLetter = "";
        const users = filteredUserList.map((user, key) => {

            const chr = user.name[0].toUpperCase();
            let firstLetter = null;
            if(chr !== currentLetter) {
                currentLetter = chr;
                firstLetter = currentLetter;
            }

            return (
                <React.Fragment key={user.uid}>
                    <AddMemberView 
                    firstLetter={firstLetter}
                    loggedinuser={group.loggedinuser}
                    user={user}
                    members={group.memberlist}
                    changed={this.membersUpdated} />
                </React.Fragment>
            )
        });

        const wrapperClassName = classNames({
            "popup-box": true,
            "add-member-popup": true,
            "show": this.props.open
        });

        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div className={wrapperClassName}>
                    <span className="popup-close" onClick={this.props.close} title="Close"></span>
                    <div className="popup-body">
                        <table>
                            <caption>Add Members</caption>
                            <caption className="search">
                                <input
                                    type="text" 
                                    autoComplete="off" 
                                    className="member-search" 
                                    id="chatSearch" 
                                    placeholder="Search"
                                    onChange={this.searchUsers} />
                                    <input id="searchButton" type="button" className="member-search-btn" />
                            </caption>
                            <tbody onScroll={this.handleScroll}>{users}</tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2"><button onClick={this.updateMembers}>Add</button></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatAddMembers;