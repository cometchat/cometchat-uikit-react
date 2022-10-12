import * as styles from "./Styles";
import { useState } from "react";
import { Switch } from "../../../../Switch/Switch";
import { Link } from "react-router-dom";

export const Localize = (props) => {

    const {
        theme
    } = props;

    const [activeTab, setActiveTab] = useState("English");

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the language accordingly.
            </div>

            <div className="footer">
                <Switch
                    title={"Language"}
                    switch1={"English"}
                    switch2={"हिन्दी"}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    theme={theme}
                />

                <Link
                    to={{
                        pathname: "/chats-demo",
                        state: { language : activeTab === "English" ? "en" : "hi" }
                    }}
                >
                    <div style={styles.btnStyle(theme)}>View</div>
                </Link>
            </div>
        </div>
    )
}