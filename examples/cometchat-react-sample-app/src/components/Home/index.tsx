import { useContext } from "react";
import { CometChatContext, CometChatList } from "@cometchat-pro/react-ui-kit";
import { fontHelper, States } from "uikit-resources-lerna";
import { Card } from "../Card";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { listStyle } from "./style";
import { CometChat } from "@cometchat-pro/chat";
import RightArrow from "../../assets/right-arrow.png";
import SwitchMode from "../../assets/switch-mode.png";
import PowerOff from "../../assets/power-off.png";
import { Button } from "../Button";
import { IsMobileViewContext } from "../../IsMobileViewContext";

type CardData = {
    id : string,
    title : string,
    description : string,
    imageInfo? : {url :  string, altText : string}
};

const cardDataList : CardData[] = [
    {
        id: "chats",
        title: "conversations",
        description: "This module contains all of the available components for listing conversation objects."
    },
    {
        id: "calls",
        title: "calls",
        description: "Calls module helps you to list the recent calls between your users and groups.",
    },
    {
        id: "messages",
        title: "messages",
        description: "This module contains all of the available components involving message objects. These components help you send, receive, and view messages."
    },
    {
        id: "users",
        title: "users",
        description: "This module contains all of the available components involving user objects."
    },
    {
        id: "groups",
        title: "groups",
        description: "This module contains all of the available components involving group objects."
    },
    {
        id: "shared",
        title: "shared",
        description: "This module contains several reusable components divided into Resources and Views. Resources are components that enhance some visual and functional aspect of a component. Views are core UI components which can collectively form a larger UI component."
    }
];

interface IHomeProps {
    loggedInUser : CometChat.User | undefined | null,
    setLoggedInUser : React.Dispatch<React.SetStateAction<CometChat.User | null | undefined>>,
    setInterestingAsyncOpStarted : React.Dispatch<React.SetStateAction<boolean>>,
    toggleTheme : () => void
};

function processUrl(url : string) {
    let i = url.length - 1;
    while (i > -1 && url[i] === "/") {
        i -= 1;
    }
    return url.slice(0, i + 1).split("/").at(-1);
}

export function Home(props : IHomeProps) {
    const {
        loggedInUser,
        setLoggedInUser,
        setInterestingAsyncOpStarted,
        toggleTheme
    } = props;

    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useContext(CometChatContext);
    const isMobileView = useContext(IsMobileViewContext);
    const currentPageName = processUrl(location.pathname); 
    const showSidebar = !isMobileView || (isMobileView && currentPageName === "home");
    const showContent = !isMobileView || (isMobileView && currentPageName !== "home"); 

    async function handleLogout() {
        try {
            setInterestingAsyncOpStarted(true);
            await CometChat.logout();
            setLoggedInUser(null);
        }
        catch(error) {
            console.log(error);
        }
        finally {
            setInterestingAsyncOpStarted(false);
        }
    }

    function getListItem() {
        return function(cardData : CardData, cardNum : number) {
            const {
                id,
                title,
                description
            } = cardData;

            return (
                <div
                    style = {{
                        paddingBottom: "16px",
                        paddingTop: cardNum ? "0" : "16px"
                    }}
                >
                    <Card 
                        onClick = {() => navigate(`${id}-module`)}
                        title = {title}
                        description = {description}
                        cardContainerStyle = {{
                            width: "100%"
                        }}
                    />
                </div>
            );
        };
    }

    function getSidebar() {
        if (showSidebar) {
            return (
                <div
                    style = {{
                        width: showContent ? "320px" : "100%",
                        display: "flex",
                        flexDirection: "column",
                        rowGap: "8px",
                        border: `1px solid ${theme.palette.getAccent200()}`,
                        backgroundColor: theme.palette.getBackground() 
                    }}
                >
                    <CometChatList 
                        list = {cardDataList}
                        listItemKey = "id"
                        state = {States.loaded}
                        listItem = {getListItem()}
                        showSectionHeader = {false}
                        hideSearch = {true}
                        title = "UI Components"
                        listStyle = {listStyle(theme)}
                    />   
                    <div
                        style = {{
                            height: "48px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            font: fontHelper(theme.typography.subtitle2),
                            color: theme.palette.getAccent500()
                        }}
                    >
                        3.0.12-pluto.beta.2
                    </div>
                </div>
            );
        }
        return null;
    }

    function getContent() {
        if (showContent) {
            return (
                <div
                    style = {{
                        width: "100%",
                        background: theme.palette.getBackground(),
                        overflowY: "auto"
                    }}
                >
                    <div
                        style = {{
                            padding: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            boxSizing: "border-box",
                            height: "48px"
                        }}
                    >
                        <div
                            style = {{
                                display: "flex",
                                columnGap: "4px",
                                alignItems: "center"
                            }}
                        >
                            <Link
                                to = "/home"
                                style = {{
                                    font: fontHelper(theme.typography.subtitle1),
                                    color: theme.palette.getAccent600(),
                                    textDecoration: "none"
                                }}
                            >
                                UI Components
                            </Link>
                            <img 
                                src = {RightArrow}
                                alt = "right arrow"
                                style = {{
                                    width: "12px",
                                    height: "12px"
                                }}
                            />
                            <span
                                style = {{
                                    font: fontHelper(theme.typography.subtitle2),
                                    color: theme.palette.getAccent400()
                                }}
                            >
                                {currentPageName === "home" ? "chats-module" : currentPageName}
                            </span>
                        </div>
                        <div
                            style = {{
                                display: "flex",
                                columnGap: "8px"
                            }}
                        >
                            <Button 
                                iconURL = {SwitchMode}
                                hoverText = "Switch theme"
                                onClick = {toggleTheme}
                                buttonStyle = {{
                                    backgroundColor: "transparent",
                                    cursor: "pointer",
                                    buttonIconTint: theme.palette.getAccent(),
                                    border: "none"
                                }}
                            />
                            <Button 
                                iconURL = {PowerOff}
                                hoverText = "Logout"
                                onClick = {handleLogout}
                                buttonStyle = {{
                                    backgroundColor: "transparent",
                                    cursor: "pointer",
                                    buttonIconTint: theme.palette.getAccent(),
                                    border: "none"
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style = {{
                            width: "100%",
                            height: "calc(100% - 48px)",
                            boxSizing: "border-box",
                            padding: "16px"
                        }}
                    >
                        <Outlet />
                    </div>
                </div>
            );
        }
        return null;
    }

    if (loggedInUser === undefined) {
        return null;
    }

    if (loggedInUser === null) {
        return <Navigate to = "/login" />;
    }

    return (
        <div
            style = {{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex"
            }}
        >
            {getSidebar()}
            {getContent()}
        </div>
    );
}
