import { CometChatTabItem, IconButtonAlignment, TabAlignment } from "@cometchat/uikit-resources";
import { TabsStyle } from "./TabsStyle";
interface TabsProps {
    tabAlignment?: TabAlignment;
    tabsStyle?: TabsStyle;
    tabs: CometChatTabItem[];
    keepAlive?: boolean;
    tabIconAlignment?: IconButtonAlignment;
}
declare const CometChatTabs: {
    (props: TabsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: TabsProps;
};
export { CometChatTabs };
