import React from "react";

/** @jsx jsx */
import { jsx } from "@emotion/core";

import { Picker } from "emoji-mart";

import {
    pickerStyle
} from "./style";

class EmojiView extends React.Component {

    render() {

        const exclude = ["search", "recent"];
        return(
            <div css={pickerStyle()}>
            <Picker
            title="Pick your emoji"
            emoji="point_up"
            native
            onClick={this.props.emojiClicked}
            showPreview={false}
            exclude={exclude}
            style={{ bottom: "100px", "zIndex": "2", "width": "100%", height: "230px" }} />
            </div>
        );
    }

}

export default EmojiView;