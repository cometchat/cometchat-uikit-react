import * as styles from "./Styles";
import { CometChatAvatar } from "@cometchat-pro/react-ui-kit";
import { useState } from "react";
import { Switch } from "../../../../Switch/Switch";

export const Avatar = (props) => {

    const {
        theme
    } = props;

    const [activeTab, setActiveTab] = useState("Image");
    const [borderRadius, setBorderRadius] = useState("22px");



    const image = "https://data-us.cometchat.io/assets/images/avatars/ironman.png";
    const name = "Prakash";
    const height = "70px";
    const width = "70px";
    const border = "1px solid grey";

    const background = "red";
    const textFont = "600 12px Inter";
    const textColor = "white";

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatAvatar component displays an image or user/group avatar with fallback to the first two letters of the user name/group name.
            </div>
            <div className="container" style={styles.container()}>
                {activeTab === "Image" ?
                    <CometChatAvatar
                        image={image}
                        style={{
                            height: height,
                            width: width,
                            borderRadius: borderRadius,
                            border: border,
                        }}
                    />
                    :
                    <CometChatAvatar
                        name={name}
                        style={{
                            nameTextColor: textColor,
                            nameTextFont: textFont,
                            backgroundColor: background,
                            height: height,
                            width: width,
                            borderRadius: borderRadius,
                            border: border,
                            outerView: border,
                            outerViewSpacing: "5px"
                        }}
                    />
                }
            </div>

            <div className="footer">
                <input
                    type="text"
                    onChange={(e) => setBorderRadius(e.target.value)}
                    placeholder="Corner Radius"
                    style={styles.inputStyle(theme)}
                />

                <Switch
                    title={"Avatar"}
                    switch1={"Image"}
                    switch2={"Name"}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    theme={theme}
                />

            </div>
        </div>
    )
}