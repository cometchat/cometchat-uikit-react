import * as styles from "./Styles";
import { CometChatBadgeCount } from "@cometchat-pro/react-ui-kit";
import { useState } from "react";

export const BadgeCount = (props) => {

    const {
        theme
    } = props;

    const [activeTab, setActiveTab] = useState(theme?.palette?.getPrimary());
    const [count, setCount] = useState(22);

    const height = "30px";
    const width = "50px";
    const borderRadius = "22px";
    const textFont = "800 14px Inter";
    const textColor = "white";

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatBadgeCount is a custom component which is used to display the unread message count. It can be used in places like ConversationListItem, etc.
            </div>
            <div className="container" style={styles.container()}>
                <CometChatBadgeCount
                    count={count}
                    style={{
                        height: height,
                        width: width,
                        borderRadius: borderRadius,
                        background: activeTab,
                        textFont: textFont,
                        textColor: textColor,
                    }}
                />
            </div>

            <div className="footer">
                <input
                    type="text"
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="Badge Count"
                    style={styles.inputStyle(theme)}
                />

                <div className="switch__button" style={styles.switchButtonsStyle(theme)}>
                    <span className="mode__title" style={styles.modeTitleStyle(theme)}>Background Color</span>
                    <ul className="tab__list" style={styles.tabListStyle(theme)}>
                        <li
                            className="tab"
                            onClick={() => setActiveTab(theme?.palette?.getPrimary())}
                            style={styles.modeStyle(theme, theme?.palette?.getPrimary(), activeTab)}
                        ></li>
                        <li
                            className="tab"
                            onClick={() => setActiveTab(theme?.palette?.getError())}
                            style={styles.modeStyle(theme, theme?.palette?.getError(), activeTab)}
                        ></li>
                        <li
                            className="tab"
                            onClick={() => setActiveTab(theme?.palette?.getSuccess())}
                            style={styles.modeStyle(theme, theme?.palette?.getSuccess(), activeTab)}
                        ></li>
                        <li
                            className="tab"
                            onClick={() => setActiveTab(theme?.palette?.getAccent700())}
                            style={styles.modeStyle(theme, theme?.palette?.getAccent700(), activeTab)}
                        ></li>
                    </ul>
                </div>

            </div>
        </div>
    )
}