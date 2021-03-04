import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatSharedMediaView } from "../../Shared";

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

    render () {

        let blockUserText;
        if(this.props.item.blockedByMe) {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={() => this.props.actionGenerated("unblockUser")}>{Translator.translate("UNBLOCK_USER", this.props.lang)}</div>
            );
        } else {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={() => this.props.actionGenerated("blockUser")}>{Translator.translate("BLOCK_USER", this.props.lang)}</div>
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
            item={this.props.item} 
            type={this.props.type} 
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
                    <div css={headerCloseStyle(navigateIcon, this.props)} className="header__close" onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
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
