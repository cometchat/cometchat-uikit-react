import { createContext } from "react";
import { CometChatTheme } from "uikit-resources-lerna";

export const CometChatContext = createContext({
    theme: new CometChatTheme({})
});
