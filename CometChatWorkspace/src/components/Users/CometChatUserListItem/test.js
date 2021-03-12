import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import "jest-canvas-mock";

import CometChatUserListItem from "./";

describe("CometChatUserListItem", () => {

    let container = null;

    it("renders without crashing", () => {
        container = document.createElement("div");
        ReactDOM.render(<CometChatUserListItem />, container);
    });

    it("renders user data", async () => {

        const fakeUser = {
            uid: "jonibaez",
            name: "Joni Baez",
            status: "online",
            role: "default"
        };

        jest.spyOn(Storage.prototype, 'setItem');
        global.fetch = jest.fn().mockImplementation(() => fakeUser);

        // Use the asynchronous version of act to apply resolved promises
        await act(async () => {
            ReactDOM.render(<CometChatUserListItem user={fakeUser} />, container);
        });

        expect(container.querySelector(".item__details__name").textContent).toBe(fakeUser.name);

        // remove the mock to ensure tests are completely isolated
        global.fetch.mockClear();
        delete global.fetch;
    });

});

