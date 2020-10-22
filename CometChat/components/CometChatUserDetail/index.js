import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import SharedMediaView from "../SharedMediaView";

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

import navigateIcon from "./resources/navigate_before.svg";

class CometChatUserDetail extends React.Component {

    render () {

        let blockUserText;
        if(this.props.item.blockedByMe) {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={() => this.props.actionGenerated("unblockUser")}>Unblock User</div>
            );
        } else {
            blockUserText = (
                <div css={itemLinkStyle(1, this.props)} className="item__link" onClick={() => this.props.actionGenerated("blockUser")}>Block User</div>
            );
        }

        let blockUserView = (
            <div css={privacySectionStyle(this.props)} className="section section__privacy">
                <h6 css={sectionHeaderStyle(this.props)} className="section__header">Options</h6>
                <div css={sectionContentStyle()} className="section__content">
                    <div css={contentItemStyle()} className="content__item">{blockUserText}</div>
                </div>
            </div>
        );
        
        let sharedmediaView = (
            <SharedMediaView theme={this.props.theme} containerHeight="50px" item={this.props.item} type={this.props.type} widgetsettings={this.props.widgetsettings} />
        );

        if(this.props.hasOwnProperty("widgetsettings") 
        && this.props.widgetsettings
        && this.props.widgetsettings.hasOwnProperty("main")) {

            //if block_user is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("block_user")
            && this.props.widgetsettings.main["block_user"] === false) {
                blockUserView = null;
            }

            //if view_shared_media is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("view_shared_media")
            && this.props.widgetsettings.main["view_shared_media"] === false) {
                sharedmediaView = null;
            }
        }

        return (
            <div css={userDetailStyle(this.props)} className="detailpane detailpane--user">
                <div css={headerStyle(this.props)} className="detailpane__header">
                    <div css={headerCloseStyle(navigateIcon)} className="header__close" onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
                    <h4 css={headerTitleStyle()} className="header__title">Details</h4>
                </div>
                <div css={sectionStyle()} className="detailpane__section">
                    {blockUserView}
                    {sharedmediaView}
                </div>
            </div>
        );
    }
}

export default CometChatUserDetail;