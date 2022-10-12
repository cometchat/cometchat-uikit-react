import * as styles from "./Styles";
import { useState } from "react";
import { Switch } from "../../../../Switch/Switch";
import { Link } from "react-router-dom";

export const Theme = (props) => {

    const {
        theme
    } = props;

    const [activeTab, setActiveTab] = useState("Default");

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatTheme is a style applied to every component and every view in the activity or component in the UI Kit.
            </div>

            <div className="footer">
                <Switch
                    title={"Theme"}
                    switch1={"Default"}
                    switch2={"Custom"}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    theme={theme}
                />

                <Link
                    to={{
                        pathname: "/chats-demo",
                        state: { theme: activeTab === "Default" ? "light" : "dark" }
                    }}
                >
                    <div style={styles.btnStyle(theme)}>View</div>
                </Link>
            </div>
        </div >
    )
}