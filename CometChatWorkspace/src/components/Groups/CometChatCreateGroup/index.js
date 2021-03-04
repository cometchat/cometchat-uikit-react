import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatBackdrop } from "../../Shared";

import * as enums from "../../../util/enums.js";
import Translator from "../../../resources/localization/translator";

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
} from "./style";

import closeIcon from "./resources/close.png";

class CometChatCreateGroup extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            error: null,
            passwordInput: false,
            name: "",
            type: "",
            password: "",
        }
    }

    //Set default props
    static defaultProps = {
        lang: Translator.getDefaultLanguage(),
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
            this.setState({ error: Translator.translate("GROUP_NAME_BLANK", this.props.lang) })
            return false;
        }

        if(!groupType) {
            this.setState({ error: Translator.translate("GROUP_TYPE_BLANK", this.props.lang) })
            return false;
        }

        let password = "";
        if(groupType === "protected") {
            password = this.state.password;

            if(!password.length) {
                this.setState({ error: Translator.translate("GROUP_PASSWORD_BLANK", this.props.lang) })
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
            this.props.actionGenerated(enums.ACTIONS["GROUP_CREATED"], group);

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
                        placeholder={Translator.translate("ENTER_GROUP_PASSWORD", this.props.lang)}
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
                <CometChatBackdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)} className="modal__creategroup">
                    <span css={modalCloseStyle(closeIcon)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.props.lang)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle()} className="modal__title">{Translator.translate("CREATE_GROUP", this.props.lang)}</caption>
                            <tbody css={tableBodyStyle()} className="modal__search">
                                <tr className="error">
                                    <td><div css={tableErrorStyle()}>{this.state.error}</div></td>
                                </tr>
                                <tr>
                                    <td>
                                        <input
                                        autoComplete="off"
                                        css={inputStyle(this.props)}
                                        className="search__input" 
                                        placeholder={Translator.translate("ENTER_GROUP_NAME", this.props.lang)}
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
                                        className="grouptype" 
                                        onChange={this.typeChangeHandler}
                                        value={this.state.type}
                                        tabIndex="2">
                                            <option value="">{Translator.translate("SELECT_GROUP_TYPE", this.props.lang)}</option>
                                            <option value="public">{Translator.translate("PUBLIC", this.props.lang)}</option>
                                            <option value="private">{Translator.translate("PRIVATE", this.props.lang)}</option>
                                            <option value="protected">{Translator.translate("PASSWORD_PROTECTED", this.props.lang)}</option>
                                        </select>
                                    </td>
                                </tr>
                                {password}
                            </tbody>
                            <tfoot css={tableFootStyle(this.props)}>
                                <tr className="creategroup">
                                    <td><button type="button" tabIndex="4" onClick={this.createGroup}>{Translator.translate("CREATE", this.props.lang)}</button></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

// Specifies the default values for props:
CometChatCreateGroup.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatCreateGroup.propTypes = {
    lang: PropTypes.string,
}

export default CometChatCreateGroup;