import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import "jest-canvas-mock";

import { CometChatContextProvider } from "../../../util/CometChatContext";
import { CometChatGroupListItem } from "./";

describe("CometChatGroupListItem", () => {

    let container = null;

    it("renders without crashing", () => {
        container = document.createElement("div");
        ReactDOM.render(
            <CometChatContextProvider group="">
                <CometChatGroupListItem />
            </CometChatContextProvider>,
            container,
        );
    });

    it("renders group data", async () => {

        const fakeGroup = {
            guid: "supergroup",
            name: "Comic Heros' Hangout",
            type: "public",
            icon: "https://data-us.cometchat.io/assets/images/avatars/supergroup.png",
            membersCount: 10
        };

        jest.spyOn(Storage.prototype, 'setItem');
        global.fetch = jest.fn().mockImplementation(() => fakeGroup);

        // Use the asynchronous version of act to apply resolved promises
        await act(async () => {
            ReactDOM.render(
                <CometChatContextProvider group="">
                    <CometChatGroupListItem group={fakeGroup} />
                </CometChatContextProvider>,
                container,
            );
        });

        expect(container.querySelector(".item__details__name > p").textContent).toBe(fakeGroup.name);

        // remove the mock to ensure tests are completely isolated
        global.fetch.mockClear();
        delete global.fetch;
    });

});