import React from "react";

import { CometChat } from "@cometchat-pro/chat";

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import GroupDetailContext from '../CometChatGroupDetail/context';

import scopeIcon from "./resources/create.svg";
import doneIcon from "./resources/done.svg";
import clearIcon from "./resources/clear.svg";
import banIcon from "./resources/block.svg";
import kickIcon from "./resources/delete.svg";
import "./style.scss";

class MemberView extends React.Component {

    static contextType = GroupDetailContext;

    constructor(props) {
        super(props);

        this.changeScopeDropDown = (
            <select 
            className="members-scope-select"
            onChange={this.scopeChangeHandler}
            defaultValue={this.props.member.scope}></select>
        )

        this.roles = {}
        this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = "Administrator";
        this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = "Moderator";
        this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = "Participant";
    }
    

    state = {
        showChangeScope: false,
        scope: null
    }

    toggleChangeScope = (flag) => {
        this.setState({ showChangeScope: flag });
    }

    scopeChangeHandler = (event) => {
        this.setState({scope: event.target.value});
    }

    updateMemberScope = () => {
        this.props.actionGenerated("changescope", this.props.member, this.state.scope);
        this.toggleChangeScope();
    }

    render() {

        const group = this.context;

        let editClassName = "";
    
        let name = this.props.member.name;
        let scope = this.roles[this.props.member.scope];
        let changescope = null;
        let ban = (<img src={banIcon} alt="Ban" onClick={() => {this.props.actionGenerated("ban", this.props.member)}} />);
        let kick = (<img src={kickIcon} alt="Kick" onClick={() => {this.props.actionGenerated("kick", this.props.member)}} />);
        

        if(this.state.showChangeScope) {

            let options = (
                <React.Fragment>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.ADMIN}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN]}</option>
                </React.Fragment>
            );

            if (this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR
                && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

                options = (
                    <React.Fragment>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    </React.Fragment>
                );
            }

            changescope = (
                <div className="members-scope-select-wrap">
                    <select 
                    className="members-scope-select"
                    onChange={this.scopeChangeHandler}
                    defaultValue={this.props.member.scope}>{options}</select>
                    <img src={doneIcon} alt="Change Scope" onClick={this.updateMemberScope} />
                    <img src={clearIcon} alt="Change Scope" onClick={() => this.toggleChangeScope(false)} />
                </div>
            );

        } else {
            changescope = (
                <img src={scopeIcon} alt="Change Scope" onClick={() => this.toggleChangeScope(true)} />
            );
        }

        //disable change scope, kick, ban of group owner
        if(this.props.item.owner === this.props.member.uid) {
            scope = "Owner";
            changescope = null;
            ban = null;
            kick = null;
        }

        //disable change scope, kick, ban of self
        if(group.loggedinuser.uid === this.props.member.uid) {
            name = "You";
            changescope = null;
            ban = null;
            kick = null;
        }

        //if the loggedin user is moderator, don't allow to change scope, ban, kick group moderators or administrators
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR 
        && (this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)) {
            changescope = null;
            ban = null;
            kick = null;
        }

        //if the loggedin user is administrator but not group owner, don't allow to change scope, ban, kick group administrators
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
        && this.props.item.owner !== group.loggedinuser.uid 
        && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            
            changescope = null;
            ban = null;
            kick = null;
        }

        let editAccess = (
            <React.Fragment>
                <td data-label="Change Scope" className="changescope"><span>{changescope}</span></td>
                <td data-label="Ban" className="ban"><span>{ban}</span></td>
                <td data-label="Kick" className="kick"><span>{kick}</span></td>
            </React.Fragment>
        );

        //if the loggedin user is participant, don't show change scope, ban, kick group members
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            editAccess = null;
            editClassName = "noedit";
        }
        
        return (
            <tr>
                <td data-label="Name" className={editClassName}>
                    <span className="avatar">
                        <Avatar 
                        image={this.props.member.avatar} 
                        cornerRadius="18px" 
                        borderColor="#CCC"
                        borderWidth="1px" />
                        <StatusIndicator
                        status={this.props.member.status}
                        cornerRadius="50%" 
                        borderColor="rgb(238, 238, 238)" 
                        borderWidth="1px" />
                    </span>
                    <span className="name">{name}</span>
                </td>
                <td data-label="Scope" className="role">{scope}</td>
                {editAccess}
            </tr>
        );
    }
}

export default MemberView;