import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatSharedMediaView } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import Translator from "../../../resources/localization/translator";

import {
    userDetailStyle,
    headerStyle,
    headerCloseStyle,
    headerTitleStyle,
    sectionStyle,
    privacySectionStyle,
    sectionHeaderStyle,
    sectionContentStyle,
    contentItemStyle,
    itemLinkStyle
} from "./style";

import navigateIcon from "./resources/navigate.png";

class CometChatUserDetails extends React.Component {

    static contextType = CometChatContext;

    blockUser = () => {

        let uid = this.context.item.uid;
        let usersList = [uid];
        CometChat.blockUsers(usersList).then(response => {

            //uid = Number(uid);
            
            if (response && response.hasOwnProperty(uid) && response[uid].hasOwnProperty("success") && response[uid]["success"] === true) {

                this.context.setToastMessage("success", "BLOCK_USER_SUCCESS");
                this.context.setItem(Object.assign({}, this.context.item, { blockedByMe: true }));
                this.context.setType(CometChat.ACTION_TYPE.TYPE_USER);

            } else {

                const errorCode = "BLOCK_USER_FAIL";
                this.context.setToastMessage("error", errorCode);
            }
            

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    unblockUser = () => {

        let uid = this.context.item.uid;
        let usersList = [uid];
        CometChat.unblockUsers(usersList).then(response => {

            //uid = Number(uid);
            if (response && response.hasOwnProperty(uid) && response[uid].hasOwnProperty("success") && response[uid]["success"] === true) {

                this.context.setToastMessage("success", "UNBLOCK_USER_SUCCESS");
                this.context.setItem(Object.assign({}, this.context.item, { blockedByMe: false }));
                this.context.setType(CometChat.ACTION_TYPE.TYPE_USER);
                
            } else {

                const errorCode = "UNBLOCK_USER_FAIL";
                this.context.setToastMessage("error", errorCode);
            }

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    render () {

        let blockUserText;
        if (this.context.item.blockedByMe) {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={this.unblockUser}>{Translator.translate("UNBLOCK_USER", this.props.lang)}</div>
            );
        } else {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={this.blockUser}>{Translator.translate("BLOCK_USER", this.props.lang)}</div>
            );
        }

        let blockUserView = (
            <div css={privacySectionStyle(this.props)} className="section section__privacy">
                <h6 css={sectionHeaderStyle(this.props)} className="section__header">{Translator.translate("OPTIONS", this.props.lang)}</h6>
                <div css={sectionContentStyle()} className="section__content">
                    <div css={contentItemStyle()} className="content__item">{blockUserText}</div>
                </div>
            </div>
        );
        
        let sharedmediaView = (
            <CometChatSharedMediaView 
            theme={this.props.theme} 
            containerHeight="50px" 
            lang={this.props.lang}
            widgetsettings={this.props.widgetsettings} />
        );

        //if block/unblock user is disabled in chat widget
        if (validateWidgetSettings(this.props.widgetsettings, "block_user") === false) {
            blockUserView = null;
        }

        //if shared media is disabled in chat widget
        if (validateWidgetSettings(this.props.widgetsettings, "view_shared_media") === false) {
            sharedmediaView = null;
        }

        return (
            <div css={userDetailStyle(this.props)} className="detailpane detailpane--user">
                <div css={headerStyle(this.props)} className="detailpane__header">
                    <div css={headerCloseStyle(navigateIcon, this.props)} className="header__close" onClick={() => this.props.actionGenerated(enums.ACTIONS["CLOSE_USER_DETAIL"])}></div>
                    <h4 css={headerTitleStyle()} className="header__title">{Translator.translate("DETAILS", this.props.lang)}</h4>
                </div>
                <div css={sectionStyle()} className="detailpane__section">
                    {blockUserView}
                    {sharedmediaView}
                </div>
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatUserDetails.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatUserDetails.propTypes = {
    lang: PropTypes.string
}

export default CometChatUserDetails;
