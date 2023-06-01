import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { CometChatContext, CometChatConversationsWithMessages, CometChatPalette, CometChatTheme } from "@cometchat-pro/react-ui-kit";

export function ConversationsWithMessagesWrapper({ isMobileView } : {isMobileView : boolean}) {
    const { state } = useLocation();
    const changeThemeToCustom = state?.changeThemeToCustom;
    const { theme } = useContext(CometChatContext);

    const themeContext = useMemo(() => {
        let res = theme;
        if (changeThemeToCustom) {
            res = new CometChatTheme({
                palette: new CometChatPalette({
                    mode: theme.palette.mode,
                    primary: {
                        light: "#D422C2",
                        dark: "#D422C2",
                    },
                    accent: {
                        light: "#07E676",
                        dark: "#B6F0D3",
                    },
                    accent50: {
                        light: "#39f",
                        dark: "#141414",
                    },
                    accent900: {
                        light: "white",
                        dark: "black",
                    }
                }),
            }) 
        }
        return {theme: res};
    }, [theme, changeThemeToCustom]);

    return (
        <CometChatContext.Provider value = {themeContext}>
            <CometChatConversationsWithMessages 
                isMobileView = {isMobileView}
            />
        </CometChatContext.Provider>
    );
}
