import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { Home } from "./Home/Home";
import {
	CometChatConversationList,
	CometChatConversationsWithMessages,
	CometChatGroupList,
	CometChatGroupsWithMessages,
	CometChatLocalize,
	CometChatTheme,
	CometChatUserList,
	CometChatUsersWithMessages,
	CometChatConversations,
	CometChatUsers,
	CometChatGroups,
	CometChatMessages,
	CometChatMessageList,
	CometChatMessageHeader,
	CometChatMessageComposer,
} from "@cometchat-pro/react-ui-kit";

/**
 * icons
 */
import sidebarIconURL from "./assets/sidebar.png";
import listwrapperIconURL from "./assets/listwrapper.png";
import listIconURL from "./assets/list.png";
import composerIconURL from "./assets/composer.png";
import soundIconURL from "./assets/sound-small.png";
import localizeIconURL from "./assets/localize.png";
import themeIconURL from "./assets/theme.png";
import conversationIconURL from "./assets/conversation.png";
import avatarIconURL from "./assets/avatar.png";
import statusIconURL from "./assets/status.png";
import badgeIconURL from "./assets/badge.png";
import receiptIconURL from "./assets/receipt.png";

import { Avatar } from "./CometChatComponents/Shared/Secondary/Avatar/Avatar";
import { DataItem } from "./CometChatComponents/Shared/SDKDerived/DataItem/DataItem";
import { ConversationListItem } from "./CometChatComponents/Shared/SDKDerived/ConversationListItem/ConversationListItem";
import { StatusIndicator } from "./CometChatComponents/Shared/Secondary/StatusIndicator/StatusIndicator";
import { BadgeCount } from "./CometChatComponents/Shared/Secondary/BadgeCount/BadgeCount";
import { MessageReceipt } from "./CometChatComponents/Shared/Secondary/MessageReceipt/MessageReceipt";
import { SoundManager } from "./CometChatComponents/Shared/Primary/SoundManager/SoundManager";
import { Theme } from "./CometChatComponents/Shared/Primary/Theme/Theme";
import { Localize } from "./CometChatComponents/Shared/Primary/Localize/Localize";
import { Login } from "./Login/Login";
import { Signup } from "./Signup/Signup";

const layout = {
	"chats-module": {
		title: "Chats",
		description:
			"Conversations module helps you to list the recent conversations between your users and groups. To learn more about its components click here.",
		sections: [
			{
				sectionTitle: "",
				sectionList: [
					{
						title: "Conversations With Messages",
						content:
							"CometChatConversationsWithMessages is an independent component used to set up a screen that shows the recent conversations and allows you to send a message to the user or group from the list.",
						icon: conversationIconURL,
						redirectURL: "/conversations-with-messages",
					},
					{
						title: "Conversations",
						content:
							"CometChatConversations is an independent component used to set up a screen that shows the recent conversations alone.",
						icon: sidebarIconURL,
						redirectURL: "/conversations",
					},
					{
						title: "Conversation List",
						content:
							"CometChatConversationList component renders a scrollable list of all recent conversations in your app.",
						icon: listIconURL,
						redirectURL: "/conversation-list",
					},
					{
						title: "Conversation List Item",
						content:
							"CometChatConversationListItem is a reusable component which is used to display the conversation list item in the conversation list.",
						icon: listwrapperIconURL,
						renderComponent: {
							title: "Conversation List Item",
							component: ConversationListItem,
							width: "30%",
						},
					},
				],
			},
		],
	},
	"users-module": {
		title: "Users",
		description:
			"Users module helps you list all the users available in your app. To learn more about its components click here.",
		sections: [
			{
				sectionTitle: "",
				sectionList: [
					{
						title: "Users With Messages",
						content:
							"CometChatUsersWithMessages is an independent component used to set up a screen that shows the list of users available in your app and gives you the ability to search for a specific user and to start conversation.",
						icon: conversationIconURL,
						redirectURL: "/users-with-messages",
					},
					{
						title: "Users",
						content:
							"CometChatUsers is an independent component used to set up a screen that displays a scrollable list of users available in your app and gives you the ability to search for a specific user.",
						icon: sidebarIconURL,
						redirectURL: "/users",
					},
					{
						title: "User List",
						content:
							"CometChatUserList component renders a scrollable list of users in your app.",
						icon: listIconURL,
						redirectURL: "/user-list",
					},
					{
						title: "Data Item (User)",
						content:
							"CometChatDataItem is used to display the user list item in a user list. It houses the Avatar, Status indicator and Title",
						icon: listwrapperIconURL,
						renderComponent: {
							title: "User List Item",
							component: DataItem,
							width: "30%",
						},
					},
				],
			},
		],
	},
	"groups-module": {
		title: "Groups",
		description:
			"Groups module helps you list all the groups you are part of in your app. To learn more about its components click here.",
		sections: [
			{
				sectionTitle: "",
				sectionList: [
					{
						title: "Groups With Messages",
						content:
							"CometChatGroupsWithMessages is an independent component used to set up a screen that shows the list of groups available in your app and gives you the ability to search for a specific group and to start a conversation.",
						icon: conversationIconURL,
						redirectURL: "/groups-with-messages",
					},
					{
						title: "Groups",
						content:
							"CometChatGroups is an independent component used to set up a screen that displays the list of groups available in your app and gives you the ability to search for a specific group.",
						icon: sidebarIconURL,
						redirectURL: "/groups",
					},
					{
						title: "Group List",
						content:
							"CometChatGroupList component renders a scrollable list of groups in your app.",
						icon: listIconURL,
						redirectURL: "/group-list",
					},
					{
						title: "Data Item (Group)",
						content:
							"CometChatDataItem is used to display the group list item in the group list. It houses the Avatar, Status indicator, Title and Subtitle.",
						icon: listwrapperIconURL,
						renderComponent: {
							title: "Group List Item",
							component: DataItem,
							width: "30%",
						},
					},
				],
			},
		],
	},
	"messages-module": {
		title: "Messages",
		description:
			"Messages module helps you to send and receive in a conversation between a user or group. To learn more about its components click here.",
		sections: [
			{
				sectionTitle: "",
				sectionList: [
					{
						title: "Messages",
						content:
							"The CometChatMessages component is an independent component that is used to handle messages for users and groups.",
						icon: conversationIconURL,
						redirectURL: "/messages",
					},
					{
						title: "Message Header",
						content:
							"CometChatMessageHeader is an independent component that  displays the User or Group information using SDK's User or Group object.",
						icon: sidebarIconURL,
						redirectURL: "/message-header",
					},
					{
						title: "Message List",
						content:
							"CometChatMessageList displays a list of messages and handles real-time operations.",
						icon: listIconURL,
						redirectURL: "/message-list",
					},
					{
						title: "Message Composer",
						content:
							"CometChatComposer is an independent and a critical component that allows users to compose and send various types of messages such as text, image, video and custom messages.",
						icon: composerIconURL,
						redirectURL: "/message-composer",
					},
				],
			},
		],
	},
	"shared-module": {
		title: "Shared",
		description:
			"Share module contains several reusable components that are divided into Primary, Secondary and SDK derived components. To learn more about these components click here.",
		sections: [
			{
				sectionTitle: "Primary",
				sectionList: [
					{
						title: "Sound Manager",
						content:
							"CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in UI Kit. for example, events like incoming and outgoing messages.",
						icon: soundIconURL,
						renderComponent: {
							title: "Sound Manager",
							component: SoundManager,
							width: "30%",
						},
					},
					{
						title: "Theme",
						content:
							"CometChatTheme is a style applied to every component and every view in the activity or component in the UI Kit.",
						icon: themeIconURL,
						renderComponent: {
							title: "Theme",
							component: Theme,
							width: "30%",
						},
					},
					{
						title: "Localize",
						content:
							"CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the language accordingly.",
						icon: localizeIconURL,
						renderComponent: {
							title: "Localize",
							component: Localize,
							width: "30%",
						},
					},
				],
			},
			{
				sectionTitle: "SDK Derived",
				sectionList: [
					{
						title: "Conversation List Item",
						content:
							"CometChatConversationListItem is a reusable component which is used to display the conversation list item in the conversation list.",
						icon: conversationIconURL,
						renderComponent: {
							title: "Conversation List Item",
							component: ConversationListItem,
							width: "30%",
						},
					},
					{
						title: "Data Item",
						content:
							"CometChatDataItem is a reusable component which is used across multiple components in different variations such as User List, Group List as a List Item.",
						icon: conversationIconURL,
						renderComponent: {
							title: "Data Item",
							component: DataItem,
							width: "30%",
						},
					},
				],
			},
			{
				sectionTitle: "Secondary",
				sectionList: [
					{
						title: "Avatar",
						content:
							"CometChatAvatar component displays an image or user/group avatar with fallback to the first two letters of the user name/group name.",
						icon: avatarIconURL,
						renderComponent: {
							title: "Avatar",
							component: Avatar,
							width: "30%",
						},
					},
					{
						title: "Status Indicator",
						content:
							"StatusIndicator component indicates whether a user is online or offline.",
						icon: statusIconURL,
						renderComponent: {
							title: "Status Indicator",
							component: StatusIndicator,
							width: "30%",
						},
					},
					{
						title: "Badge Count",
						content:
							"CometChatBadgeCount is a custom component which is used to display the unread message count. It can be used in places like ConversationListItem, etc.",
						icon: badgeIconURL,
						renderComponent: {
							title: "Badge Count",
							component: BadgeCount,
							width: "30%",
						},
					},
					{
						title: "Message Receipt",
						content:
							"CometChatMessageReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message.",
						icon: receiptIconURL,
						renderComponent: {
							title: "Message Receipt",
							component: MessageReceipt,
							width: "30%",
						},
					},
				],
			},
		],
	},
};

export const App = (props) => {
	const [loggedInUser, setLoggedInUser] = useState(null);
	const [width, setWidth] = useState(null);

	const updateSize = () => {
		setWidth(window.innerWidth);
	};

	useEffect(() => {
		CometChat.getLoggedinUser()
			.then((user) => {
				setLoggedInUser(user);
			})
			.catch((error) => {
				throw error;
			});
		window.addEventListener("resize", updateSize);
		updateSize();
		return () => window.removeEventListener("resize", updateSize);
    }, []);
    
    let _isMobileView
    if (width >= 320 && width <= 760){
        _isMobileView = true
    } else {
        _isMobileView = false
    }

	if (!loggedInUser) {
		return (
			<div>
				<Switch>
					<Route
						exact
						path='/'
						render={() => <Login setLoggedInUser={setLoggedInUser} />}
					/>

					<Route
						exact
						path='/login'
						render={() => <Login setLoggedInUser={setLoggedInUser} />}
					/>

					<Route
						exact
						path='/signup'
						render={() => <Signup setLoggedInUser={setLoggedInUser} />}
					/>
				</Switch>
			</div>
		);
	} else {
		return (
			<div>
				<Switch>
					<Route
						exact
						path='/'
						render={() => (
							<Home isMobileView={_isMobileView} menu={layout} setLoggedInUser={setLoggedInUser} />
						)}
					/>

					<Route
						exact
						path='/home'
						render={() => (
							<Home isMobileView={_isMobileView} menu={layout} setLoggedInUser={setLoggedInUser} />
						)}
					/>

                    <Route
                        exact
                        path="/chats-module"
                        render={() => <Home isMobileView={_isMobileView} menu={layout} data={layout["chats-module"]} setLoggedInUser={setLoggedInUser} />}
                    />

                    <Route
                        exact
                        path="/users-module"
                        render={() => <Home isMobileView={_isMobileView} menu={layout} data={layout["users-module"]} setLoggedInUser={setLoggedInUser} />}
                    />

                    <Route
                        exact
                        path="/groups-module"
                        render={() => <Home isMobileView={_isMobileView} menu={layout} data={layout["groups-module"]} setLoggedInUser={setLoggedInUser} />}
                    />

                    <Route
                        exact
                        path="/messages-module"
                        render={() => <Home isMobileView={_isMobileView} menu={layout} data={layout["messages-module"]} setLoggedInUser={setLoggedInUser} />}
                    />

					<Route
						exact
						path='/shared'
						render={() => (
							<Home isMobileView={_isMobileView}
								menu={layout}
								data={layout["shared-module"]}
								setLoggedInUser={setLoggedInUser}
							/>
						)}
					/>

					<Route
						exact
						path='/conversations-with-messages'
						render={(props) => {
							/**Localize scoping */
							if (props?.location?.state?.language) {
								CometChatLocalize.setLocale(props?.location?.state?.language);
							} else {
								CometChatLocalize.setLocale("en");
							}

							/**Theme scoping */
							const _theme = new CometChatTheme({
								palette: {
									mode: props?.location?.state?.theme ?? "light",
								},
                            });
                           

							return (
                                <CometChatConversationsWithMessages {...props} theme={_theme} isMobileView={_isMobileView} />
							);
						}}
					/>

					<Route
						exact
						path='/users-with-messages'
                        render = {()=> <CometChatUsersWithMessages isMobileView={_isMobileView} />}
					/>

					<Route
						exact
                        path='/groups-with-messages'
                        render = {()=> <CometChatGroupsWithMessages isMobileView={_isMobileView} />}
					/>

					<Route
						exact
						path='/conversations'
						component={CometChatConversations}
					/>

					<Route exact path='/users' component={CometChatUsers} />

					<Route exact path='/groups' component={CometChatGroups} />

					<Route
						exact
						path='/conversation-list'
						component={CometChatConversationList}
					/>

					<Route exact path='/user-list' component={CometChatUserList} />

					<Route exact path='/group-list' component={CometChatGroupList} />

					<Route exact path='/messages' component={CometChatMessages} />

					<Route exact path='/message-list' component={CometChatMessageList} />

					<Route
						exact
						path='/message-header'
						component={CometChatMessageHeader}
					/>

					<Route
						exact
						path='/message-composer'
						component={CometChatMessageComposer}
					/>
				</Switch>
			</div>
		);
	}
};
