import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import "jest-canvas-mock";

import { CometChatContextProvider } from "../../../util/CometChatContext";
import { CometChatConversationListItem } from "./";

describe("CometChatConversationListItem", () => {

    let container = null;

    it("renders without crashing", () => {
        container = document.createElement("div");
        ReactDOM.render(
            <CometChatContextProvider user="">
                <CometChatConversationListItem />
            </CometChatContextProvider>,
            container,
        );
    });

});