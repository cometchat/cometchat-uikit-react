import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core';
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import { CometChatContext } from "../../../../util/CometChatContext";
import * as enums from "../../../../util/enums.js";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import { 
    stickerWrapperStyle, 
    stickerSectionListStyle, 
    stickerListStyle,
    sectionListItemStyle,
    stickerItemStyle,
    stickerMsgStyle,
    stickerMsgTxtStyle,
    stickerCloseStyle
} from "./style";

import closeIcon from "./resources/close.svg";

class CometChatStickerKeyboard extends React.PureComponent {

    static contextType = CometChatContext;

    constructor(props, context) {

        super(props, context);

        this.decoratorMessage = Translator.translate("LOADING", context.language);

        this.state = {
            stickerlist: [],
            stickerset: {},
            activestickerlist: [],
            activestickerset: null
        }
    }

    componentDidMount() {
        this.getStickers();
    }

    getStickers = () => {

        CometChat.callExtension('stickers', 'GET', 'v1/fetch', null).then(stickers => {

            // Stickers received
            let activeStickerSet = null; 
            const customStickers = (stickers.hasOwnProperty("customStickers")) ? stickers["customStickers"] : [];
            const defaultStickers = (stickers.hasOwnProperty("defaultStickers")) ? stickers["defaultStickers"] : [];

            defaultStickers.sort(function (a, b) {
                return a.stickerSetOrder - b.stickerSetOrder;
            });

            customStickers.sort(function (a, b) {
                return a.stickerSetOrder - b.stickerSetOrder;
            });

            const stickerList = [...defaultStickers, ...customStickers];
            
            if (stickerList.length === 0) {
                this.decoratorMessage = Translator.translate("NO_STICKERS_FOUND", this.context.language);
            }

            const stickerSet = stickerList.reduce((r, sticker, index) => {

                const { stickerSetName } = sticker;
                if (index === 0) {
                    activeStickerSet = stickerSetName;
                }

                r[stickerSetName] = [...r[stickerSetName] || [], { ...sticker}];

                return r;
            }, {});

            let activeStickerList = [];
            if (Object.keys(stickerSet).length) {

                Object.keys(stickerSet).forEach(key => {
                    stickerSet[key].sort(function (a, b) {
                        return a.stickerOrder - b.stickerOrder;
                    });
                });

                activeStickerList = stickerSet[activeStickerSet];
            }
            
            this.setState({ 
                "stickerlist": stickerList, 
                "stickerset": stickerSet, 
                "activestickerlist": activeStickerList, 
                "activestickerset": activeStickerSet 
            });

        }).catch(error => {
            
            this.decoratorMessage = Translator.translate("SOMETHING_WRONG", this.context.language);
            this.setState({ "activestickerlist": [], "stickerset": {} });
        });
    }

    sendStickerMessage = (stickerItem) => {
        this.props.actionGenerated(enums.ACTIONS["SEND_STICKER"], stickerItem);
    }

    onStickerSetClicked = (sectionItem) => {

        this.setState({ activestickerlist: [] }, () => {

            const stickerSet = { ...this.state.stickerset };
            const activeStickerList = stickerSet[sectionItem];
            this.setState({ "activestickerset": sectionItem, "activestickerlist": activeStickerList });
        });
    }

    closeStickerKeyboard = () => {
        this.props.actionGenerated(enums.ACTIONS["CLOSE_STICKER_KEYBOARD"]);
    }

    render() {

        let messageContainer = null;
        if (this.state.activestickerlist.length === 0) {
            messageContainer = (
                <div css={stickerMsgStyle()} className="stickers__decorator-message">
                    <p css={stickerMsgTxtStyle(this.context)} className="decorator-message">{this.decoratorMessage}</p>
                </div>
            );
        }

        let stickers = null;
        if (Object.keys(this.state.stickerset).length) {

            const sectionItems = Object.keys(this.state.stickerset).map((sectionItem, key) => {

                const stickerSetThumbnail = this.state.stickerset[sectionItem][0]["stickerUrl"];
                return( <div  key={key}  className="stickers__sectionitem" css={sectionListItemStyle()}  onClick={() => this.onStickerSetClicked(sectionItem)}>
                    <img src={stickerSetThumbnail} alt={sectionItem} />
                </div>
                );
            });

            let activeStickerList = [];
            if (this.state.activestickerlist.length) {

                const stickerList = [...this.state.activestickerlist];
                activeStickerList = stickerList.map((stickerItem, key) => {

                    return (
                        <div key={key} css={stickerItemStyle(this.context)} onClick={() => this.sendStickerMessage(stickerItem)} className="stickers__listitem">
                            <img src={stickerItem.stickerUrl} alt={stickerItem.stickerName} />
                        </div>
                    );
                });
            }

            stickers = (
                <React.Fragment>
                    <div css={stickerCloseStyle(closeIcon, this.context)} className="stickers__close" onClick={this.closeStickerKeyboard}></div>
                    <div css={stickerListStyle(this.props)} className="stickers__list">
                        {activeStickerList}
                    </div>
                    <div css={stickerSectionListStyle(this.context)} className="stickers__sections">
                        {sectionItems}
                    </div>
                </React.Fragment>
            );
        }

        return (
            <div css={stickerWrapperStyle(this.context, keyframes)} className="stickers">
                {messageContainer}
                {stickers}
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatStickerKeyboard.defaultProps = {
    theme: theme
};

CometChatStickerKeyboard.propTypes = {
    theme: PropTypes.object
}

export { CometChatStickerKeyboard };