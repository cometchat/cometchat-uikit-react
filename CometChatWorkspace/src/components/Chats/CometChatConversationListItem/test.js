import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import "jest-canvas-mock";

import CometChatConversationListItem from "./";

describe("CometChatConversationListItem", () => {

    let container = null;

    it("renders without crashing", () => {
        container = document.createElement("div");
        ReactDOM.render(<CometChatConversationListItem />, container);
    });

    it("renders user data", async () => {

        const fakeConversation = {
            conversationId: "superhero1_user_superhero2",
            conversationType: "user",
            conversationWith: {
                uid: "superhero2",
                name: "Captain Americca",
                avatar: "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png"                
            },
            lastMessage: {
                conversationId: "superhero1_user_superhero2",
                sentAt: 1614333569
            },
            unreadMessageCount: 0,
        };

        jest.spyOn(Storage.prototype, 'setItem');
        global.fetch = jest.fn().mockImplementation(() => fakeConversation);

        // Use the asynchronous version of act to apply resolved promises
        await act(async () => {
            ReactDOM.render(<CometChatConversationListItem conversation={fakeConversation} />, container);
        });
        
        expect(container.querySelector(".item__details__name").textContent).toBe(fakeConversation.conversationWith.name);

        // remove the mock to ensure tests are completely isolated
        global.fetch.mockClear();
        delete global.fetch;
    });

    it("renders group data", async () => {

        const fakeConversation = {
            conversationId: "group_supergroup",
            conversationType: "group",
            conversationWith: {
                guid: "supergroup",
                name: "Comic Heros' Hangout",
                icon: "https://data-us.cometchat.io/assets/images/avatars/supergroup.png",
                membersCount: 10
            },
            lastMessage: {
                conversationId: "group_supergroup",
                sentAt: 1614328863
            },
            unreadMessageCount: 0,
        };

        jest.spyOn(Storage.prototype, 'setItem');
        global.fetch = jest.fn().mockImplementation(() => fakeConversation);

        // Use the asynchronous version of act to apply resolved promises
        await act(async () => {
            ReactDOM.render(<CometChatConversationListItem conversation={fakeConversation} />, container);
        });

        expect(container.querySelector(".item__details__name").textContent).toBe(fakeConversation.conversationWith.name);

        // remove the mock to ensure tests are completely isolated
        global.fetch.mockClear();
        delete global.fetch;
    });

});

