import React from "react";
import { Picker } from "emoji-mart";

import { localize } from "../../";

import {
    pickerStyle
} from "./style";

class CometChatEmojiKeyboard extends React.Component {

    categories = {};
    title = "";

    constructor(props) {

        super(props);

        const categories = {
            people: localize("SMILEY_PEOPLE"),
            nature: localize("ANIMALES_NATURE"),
            foods: localize("FOOD_DRINK"),
            activity: localize("ACTIVITY"),
            places: localize("TRAVEL_PLACES"),
            objects: localize("OBJECTS"),
            symbols: localize("SYMBOLS"),
            flags: localize("FLAGS")
        }

        const title = localize("PICK_YOUR_EMOJI");

        this.state = {
            categories: categories, 
            title: title
        }
    }

    componentDidUpdate(prevProps) {

        if(prevProps.lang !== this.props.lang) {

            const categories = {
                search: localize("SEARCH"),
                people: localize("SMILEY_PEOPLE"),
                nature: localize("ANIMALES_NATURE"),
                foods: localize("FOOD_DRINK"),
                activity: localize("ACTIVITY"),
                places: localize("TRAVEL_PLACES"),
                objects: localize("OBJECTS"),
                symbols: localize("SYMBOLS"),
                flags: localize("FLAGS")
            }

            const title = localize("PICK_YOUR_EMOJI");

            this.setState({ categories: { ...categories}, title: title });
        }
    }

    render() {

        const exclude = ["search", "recent"];
        return(
            <div style={pickerStyle()}>
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
};

CometChatEmojiKeyboard.propTypes = {
}

export { CometChatEmojiKeyboard };