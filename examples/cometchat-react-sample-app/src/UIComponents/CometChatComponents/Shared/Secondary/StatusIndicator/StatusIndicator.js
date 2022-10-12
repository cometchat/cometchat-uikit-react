import * as styles from "./Styles";
import { CometChatStatusIndicator } from "@cometchat-pro/react-ui-kit";
import { useState } from "react";
import { Switch } from "../../../../Switch/Switch";

export const StatusIndicator = (props) => {

    const {
        theme
    } = props;

    const [activeTab, setActiveTab] = useState("Online");

    const height = "60px";
    const width = "60px";
    const border = "3px solid #ddd";
    const borderRadius = "30px";

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                StatusIndicator component indicates whether a user is online or offline.
            </div>
            <div className="container" style={styles.container()}>
                <CometChatStatusIndicator
                    style={{
                        height: height,
                        width: width,
                        borderRadius: borderRadius,
                        border: border,
                        backgroundColor: activeTab === "Online" ? theme?.palette?.getSuccess() : theme?.palette?.getAccent600(),
                    }}
                />
            </div>

            <div className="footer">
                <Switch
                    title={"Status"}
                    switch1={"Online"}
                    switch2={"Offline"}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    theme={theme}
                />

            </div>
        </div>
    )
}