import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { Picker } from "emoji-mart";

import Translator from "../../../resources/localization/translator";

import {
    pickerStyle
} from "./style";

class CometChatEmojiKeyboard extends React.Component {

    categories = {};
    title = "";

    constructor(props) {

        super(props);

        const categories = {
            people: Translator.translate("SMILEY_PEOPLE", props.lang),
            nature: Translator.translate("ANIMALES_NATURE", props.lang),
            foods: Translator.translate("FOOD_DRINK", props.lang),
            activity: Translator.translate("ACTIVITY", props.lang),
            places: Translator.translate("TRAVEL_PLACES", props.lang),
            objects: Translator.translate("OBJECTS", props.lang),
            symbols: Translator.translate("SYMBOLS", props.lang),
            flags: Translator.translate("FLAGS", props.lang)
        }

        const title = Translator.translate("PICK_YOUR_EMOJI", props.lang);

        this.state = {
            categories: categories, 
            title: title
        }
    }

    componentDidUpdate(prevProps) {

        if(prevProps.lang !== this.props.lang) {

            const categories = {
                search: Translator.translate("SEARCH", this.props.lang),
                people: Translator.translate("SMILEY_PEOPLE", this.props.lang),
                nature: Translator.translate("ANIMALES_NATURE", this.props.lang),
                foods: Translator.translate("FOOD_DRINK", this.props.lang),
                activity: Translator.translate("ACTIVITY", this.props.lang),
                places: Translator.translate("TRAVEL_PLACES", this.props.lang),
                objects: Translator.translate("OBJECTS", this.props.lang),
                symbols: Translator.translate("SYMBOLS", this.props.lang),
                flags: Translator.translate("FLAGS", this.props.lang)
            }

            const title = Translator.translate("PICK_YOUR_EMOJI", this.props.lang);

            this.setState({ categories: { ...categories}, title: title });
        }
    }

    render() {

        const exclude = ["search", "recent"];
        return(
            <div css={pickerStyle()}>
            <Picker
            title={this.state.title}
            emoji="point_up"
            native
            onClick={this.props.emojiClicked}
            showPreview={false}
            exclude={exclude}
            i18n={{ categories: this.state.categories }} 
            style={{ bottom: "100px", "zIndex": "2", "width": "100%", height: "230px" }} />
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatEmojiKeyboard.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatEmojiKeyboard.propTypes = {
    lang: PropTypes.string,
}

export { CometChatEmojiKeyboard };