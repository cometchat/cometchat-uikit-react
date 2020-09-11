import React from 'react';

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import Backdrop from '../Backdrop';

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalTableStyle,
    tableCaptionStyle,
    tableBodyStyle,
    tableErrorStyle,
    inputStyle,
    tableFootStyle,
    btnContainerStyle,
} from "./style";

import closeIcon from "./resources/clear.svg";

class CometChatCreateGroup extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            error: null,
            passwordInput: false,
            name: "",
            type: "",
            password: ""
        }
    }

    passwordChangeHandler = (event) => {
        this.setState({password: event.target.value})
    }

    nameChangeHandler = (event) => {
        this.setState({name: event.target.value})
    }

    typeChangeHandler = (event) => {
        
        const type = event.target.value;
        this.setState({type: event.target.value})

        if(type === "protected") {
            this.setState({"passwordInput": true});
        } else {
            this.setState({"passwordInput": false});
        }
    }

    validate = () => {

        const groupName = this.state.name.trim();
        const groupType = this.state.type.trim();

        if(!groupName) {
            this.setState({error: "Group name cannnot be blank."})
            return false;
        }

        if(!groupType) {
            this.setState({error: "Group type cannnot be blank."})
            return false;
        }

        let password = "";
        if(groupType === "protected") {
            password = this.state.password;

            if(!password.length) {
                this.setState({error: "Group password cannnot be blank."})
                return false;
            }
        }
        return true;
    }

    createGroup = () => {

        if(!this.validate()) {
            return false;
        }

        const groupType = this.state.type.trim();
        
        const password = this.state.password;
        const guid = "group_"+new Date().getTime();
        const name = this.state.name.trim();
        let type = CometChat.GROUP_TYPE.PUBLIC;

        switch(groupType) {
            case "public":
                type = CometChat.GROUP_TYPE.PUBLIC;
                break;
            case "private":
                type = CometChat.GROUP_TYPE.PRIVATE;
                break;
            case "protected":
                type = CometChat.GROUP_TYPE.PASSWORD;
                break;
            default:
                break;
        }

        const group = new CometChat.Group(guid, name, type, password);

        CometChat.createGroup(group).then(group => {

            console.log("Group created successfully:", group);
            this.setState({error: null, name: "", type: "", password: "", passwordInput: ""})
            this.props.actionGenerated("groupCreated", group);

        }).catch(error => {
            
            console.log("Group creation failed with exception:", error);
            this.setState({error: error })
        });
    }

    render() {

        let password = null;
        if(this.state.passwordInput) {
            password = (
                <tr>
                    <td>
                        <input 
                        autoComplete="off" 
                        css={inputStyle(this.props)}
                        placeholder="Enter group password" 
                        type="password"
                        tabIndex="3"
                        onChange={this.passwordChangeHandler}
                        value={this.state.password} />
                    </td>
                </tr>
            );
        } 

        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)}>
                    <span css={modalCloseStyle(closeIcon)} onClick={this.props.close}></span>
                    <div css={modalBodyStyle()}>

                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle()}>Create Group</caption>
                            <tbody css={tableBodyStyle()}>
                                <tr>
                                    <td><div css={tableErrorStyle()}>{this.state.error}</div></td>
                                </tr>
                                <tr>
                                    <td>
                                        <input
                                        autoComplete="off"
                                        css={inputStyle(this.props)}
                                        placeholder="Enter group name"
                                        type="text"
                                        tabIndex="1"
                                        onChange={this.nameChangeHandler}
                                        value={this.state.name} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <select
                                            css={inputStyle(this.props)}
                                            onChange={this.typeChangeHandler}
                                            value={this.state.type}
                                            tabIndex="2">
                                            <option value="">Select group type</option>
                                            <option value="public">Public</option>
                                            <option value="private">Private</option>
                                            <option value="protected">Password Protected</option>
                                        </select>
                                    </td>
                                </tr>
                                {password}
                            </tbody>
                            <tfoot css={tableFootStyle(this.props)}>
                                <tr>
                                    <td><button tabIndex="4" onClick={this.createGroup}>Create</button></td>
                                </tr>
                            </tfoot>
                        </table>


                        {/* <h4 css={modalTitleStyle()}>Create Group</h4>
                        <span css={modalErrorStyle()}>{this.state.error}</span>
                        <div css={inputWrapperStyle()}>
                            <input 
                            autoComplete="off" 
                            css={inputStyle(this.props)}
                            placeholder="Enter group name" 
                            type="text"
                            tabIndex="1"
                            onChange={this.nameChangeHandler}
                            value={this.state.name} />
                        </div>

                        <div css={inputWrapperStyle()}>
                            <select 
                            css={inputStyle(this.props)}
                            onChange={this.typeChangeHandler}
                            value={this.state.type}
                            tabIndex="2">
                            <option value="">Select group type</option>
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="protected">Password Protected</option>
                            </select>
                        </div>
                        {password}
                        <div css={btnContainerStyle(this.props)}>
                            <button tabIndex="4" onClick={this.createGroup}>Create</button>
                        </div> */}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatCreateGroup;