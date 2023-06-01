import { CometChat } from "@cometchat-pro/chat";
import { useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Home } from "../Home";
import { Login } from "../Login";
import { Signup } from "../Signup";
import { Effects } from "./effects";
import { appStyle, loadingModalStyle } from "./style";
import CometChatLogo from "../../assets/cometchat_logo.png";
import LoadingIconGif from "../../assets/loading_icon.gif";
import { CometChatPalette, CometChatTheme } from "uikit-resources-lerna";
import { ChatsCardList } from "../ChatsCardList";
import { MessagesCardList } from "../MessagesCardList";
import { UsersCardList } from "../UsersCardList";
import { GroupsCardList } from "../GroupsCardList";
import { SharedCardList } from "../SharedCardList";
import { UserDetails } from "../UserDetails";
import { GroupMembersWrapper } from "../GroupMembersWrapper";
import { AddMembersWrapper } from "../AddMembersWrapper";
import { TransferOnwershipWrapper } from "../TransferOwnershipWrapper";
import { BannedMembersWrapper } from "../BannedMembersWrapper";
import { GroupDetails } from "../GroupDetails";
import { MessageHeaderWrapper } from "../MessageHeaderWrapper";
import { ComposerWrapper } from "../ComposerWrapper";
import { MessageListWrapper } from "../MessageListWrapper";
import { MessagesWrapper } from "../MessagesWrapper";
import { CreateGroupWrapper } from "../CreateGroupWrapper";
import { JoinGroupWrapper } from "../JoinGroupWrapper";
import { CallsCardList } from "../CallsCardList";
import { CallButtonsWrapper } from "../CallButtonsWrapper";
import { IsMobileViewContext } from "../../IsMobileViewContext";
import { 
  CometChatConversations,
  CometChatUsers,
  CometChatGroups,
  CometChatGroupsWithMessages,
  CometChatUsersWithMessages,
  CometChatContext
} from "@cometchat-pro/react-ui-kit";
import { ConversationsWithMessagesWrapper } from "../ConversationsWithMessagesWrapper";

export function App() {
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null | undefined>();
  const [interestingAsyncOpStarted, setInterestingAsyncOpStarted] = useState(false);
  const [theme, setTheme] = useState(new CometChatTheme({}));
  const [isMobileView, setIsMobileView] = useState(false);
  const observableRef = useRef<HTMLDivElement | null>(null);
  
  function toggleTheme() {
    const palette = new CometChatPalette({mode: theme.palette.mode === "light" ? "dark" : "light"});
    const newTheme = new CometChatTheme({palette});
    setTheme(newTheme);
  }

  let ccContextValue = useMemo(() => ({theme}), [theme]);

  function getLoadingModal() {
    return (
      <div
        style = {loadingModalStyle(interestingAsyncOpStarted)}
      >
        <div
          style = {{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            rowGap: "8px"
          }}
        >
          <img 
            src = {CometChatLogo}
            alt = "CometChat logo"
            style = {{
              width: "240px",
              height: "240px"
            }}
          />
          <img 
            src = {LoadingIconGif}
            alt = "Laoding icon"
          />
        </div>
      </div>
    );
  }

  function getLogin() {
    return (
      <Login
        loggedInUser = {loggedInUser}
        setLoggedInUser = {setLoggedInUser}
        setInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getSignup() {
    return (
      <Signup
        loggedInUser = {loggedInUser}
        setLoggedInUser = {setLoggedInUser}
        setInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getHome() {
    return (
      <Home 
        loggedInUser = {loggedInUser}
        setLoggedInUser = {setLoggedInUser}
        setInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
        toggleTheme = {toggleTheme}
      />
    );
  }

  function getChatsModule() {
    return <ChatsCardList />;
  }

  function getMessagesModule() {
    return <MessagesCardList />;
  }

  function getUsersModule() {
    return <UsersCardList />;
  }

  function getGroupsModule() {
    return <GroupsCardList />;
  }

  function getSharedModule() {
    return <SharedCardList />;
  }

  function getConversations() {
    return <CometChatConversations />;
  }

  function getConversationsWithMessages() {
    return (
      <ConversationsWithMessagesWrapper 
        isMobileView = {isMobileView}
      />
    );
  }

  function getUsersWithMessages() {
    return (
      <CometChatUsersWithMessages 
        isMobileView = {isMobileView}
      />
    );
  }

  function getUsers() {
    return <CometChatUsers />;
  }

  function getUserDetails() {
    return (
      <UserDetails
        setInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getGroupsWithMessages() {
    return (
      <CometChatGroupsWithMessages
        isMobileView = {isMobileView}
      />
    );
  }

  function getGroups() {
    return <CometChatGroups />;
  }

  function getGroupMembersWrapper() {
    return (
      <GroupMembersWrapper 
        setSomeInterestingAsyncOperation = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getAddMembersWrapper() {
    return (
      <AddMembersWrapper
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getTransferOwnershipWrapper() {
    return (
      <TransferOnwershipWrapper 
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getBannedMembersWrapper() {
    return (
      <BannedMembersWrapper
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getGroupDetails() {
    return (
      <GroupDetails 
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getMessageHeaderWrapper() {
    return (
      <MessageHeaderWrapper 
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getComposerWrapper() {
    return (
      <ComposerWrapper 
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getMessageListWrapper() {
    return (
      <MessageListWrapper 
        setSomeInterestingOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getMessagesWrapper() {
    return (
      <MessagesWrapper 
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  function getCreateGroupWrapper() {
    return (
      <CreateGroupWrapper 
        isMobileView = {isMobileView}
      />
    );
  }

  function getJoinProtectedGroupWrapper() {
    return <JoinGroupWrapper />;
  }

  function getCallsModule() {
    return <CallsCardList />;
  }

  function getCallButtonsWrapper() {
    return (
      <CallButtonsWrapper
        setSomeInterestingAsyncOpStarted = {setInterestingAsyncOpStarted}
      />
    );
  }

  Effects({
    setLoggedInUser,
    observableRef,
    setIsMobileView
  });

  return (
    <div
      style = {appStyle(theme)}
    >
      <div
        style = {{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%"
        }}
      >
        <div
          ref = {observableRef}
          style = {{
            height: "100px",
            width: "800px",
          }}
        >
        </div>
      </div>
      <div
        style = {{
          boxSizing: "border-box",
          height: "100%",
          width: "100%",
          position: "absolute",
          top: "0",
          left: "0",
          backgroundColor: "white"
        }}
      >
        <IsMobileViewContext.Provider
          value = {isMobileView}
        >
          <CometChatContext.Provider
            value = {ccContextValue}
          >
            <BrowserRouter>
              <Routes>
                <Route path = "/">
                  <Route index element = {<Navigate to = "/home" />} />
                  <Route path = "login" element = {getLogin()} />
                  <Route path = "signup" element = {getSignup()} />
                  <Route path = "home" element = {getHome()}>
                    <Route index element = {getChatsModule()} />
                    <Route path = "chats-module" element = {getChatsModule()} />
                    <Route path = "calls-module" element = {getCallsModule()} />
                    <Route path = "messages-module" element = {getMessagesModule()} />
                    <Route path = "users-module" element = {getUsersModule()} />
                    <Route path = "groups-module" element = {getGroupsModule()} />
                    <Route path = "shared-module" element = {getSharedModule()} />
                  </Route>
                </Route>
                <Route path = "home/chats-module/conversations-with-messages" element = {getConversationsWithMessages()} />
                <Route path = "home/chats-module/conversations" element = {getConversations()} />
                <Route path = "home/calls-module/call-buttons" element = {getCallButtonsWrapper()} />
                <Route path = "home/users-module/users-with-messages" element = {getUsersWithMessages()} />
                <Route path = "home/users-module/users" element = {getUsers()} />
                <Route path = "home/users-module/user-details" element = {getUserDetails()} />
                <Route path = "home/groups-module/groups-with-messages" element = {getGroupsWithMessages()} />
                <Route path = "home/groups-module/groups" element = {getGroups()} />
                <Route path = "home/groups-module/group-members" element = {getGroupMembersWrapper()} />
                <Route path = "home/groups-module/create-group" element = {getCreateGroupWrapper()} />
                <Route path = "home/groups-module/add-members" element = {getAddMembersWrapper()} />
                <Route path = "home/groups-module/transfer-ownership" element = {getTransferOwnershipWrapper()} />
                <Route path = "home/groups-module/banned-members" element = {getBannedMembersWrapper()} />
                <Route path = "home/groups-module/group-details" element = {getGroupDetails()} />
                <Route path = "home/groups-module/join-protected-group" element = {getJoinProtectedGroupWrapper()} />
                <Route path = "home/messages-module/message-header" element = {getMessageHeaderWrapper()} />
                <Route path = "home/messages-module/message-composer" element = {getComposerWrapper()} />
                <Route path = "home/messages-module/message-list" element = {getMessageListWrapper()} />
                <Route path = "home/messages-module/messages" element = {getMessagesWrapper()} />
                <Route path = "*" element = {<Navigate to = "/home" />} />
              </Routes>
            </BrowserRouter>
          </CometChatContext.Provider>
        </IsMobileViewContext.Provider>
        {getLoadingModal()}
      </div>
    </div>
  );
}
