

import { useState,useContext } from "react";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import { inputStyle,badgeDemoStyle,colorButtonStyle } from "./style";

import {CometChatContext,fontHelper} from "@cometchat-pro/react-ui-kit"

const Badge = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const [badgeCountValue, setBadgeCountValue] = useState("10")
    const [badgeColor, setBadgeColor] = useState("#3399ff")
    const handleInputChange = (value:string) => {
        setBadgeCountValue(value)
      }
    const bubbleSlug = "badge"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true

        const { theme } = useContext(CometChatContext);
    let badgeStyle = {
        textFont: fontHelper(theme.typography.subtitle2),
        textColor: theme.palette.getAccent("dark"),
        background:badgeColor,
        borderRadius:"16px",
        width:"fit-content",
        height:"16px",
        border: "none"
    }
    const handleColorChange = (color:string) => {
        setBadgeColor(color)
    }
    const themeMode = theme.palette.mode
    return (
       
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>Badge Count</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatBadgeCount is a custom component which is used to display the unread message count. It can be used in places like ConversationListItem ,etc.
                </div>
                <div className="badgeDemo" style={badgeDemoStyle}>
                    <div className="badgeWrapper">
                        <cometchat-badge count={badgeCountValue} badgeStyle={JSON.stringify(badgeStyle)} />
                    </div>
                    <input placeholder="Badge count" style={inputStyle(themeMode)} type="number" value={badgeCountValue} onChange={(e) => handleInputChange(e.target.value)} />
                </div>
                <div className="bg__wrapper" style={{marginTop: "25px", display: "flex", justifyContent: "space-between"}}>
                    <div className="bg__label">
                        Background Color
                    </div>
                    <div className="bg__btn" style={{display:"flex"}}>
                        <button onClick={(e) => handleColorChange("#3399ff")} style={{...{background: "#3399ff"},...colorButtonStyle}}>{badgeColor === "#3399ff" ? "B" : ""}</button>
                        <button onClick={(e) => handleColorChange("#ff3b30")} style={{...{background: "#ff3b30"},...colorButtonStyle}}>{badgeColor === "#ff3b30" ? "R" : ""}</button>
                        <button onClick={(e) => handleColorChange("#00c86f")} style={{...{background: "#00c86f"},...colorButtonStyle}}>{badgeColor === "#00c86f" ? "G" : ""}</button>
                        <button onClick={(e) => handleColorChange("#6929ca")} style={{...{background: "#6929ca"},...colorButtonStyle}}>{badgeColor === "#6929ca" ? "P" : ""}</button>
                    </div>
                </div>
              </div>
             </div>)

}
export { Badge };