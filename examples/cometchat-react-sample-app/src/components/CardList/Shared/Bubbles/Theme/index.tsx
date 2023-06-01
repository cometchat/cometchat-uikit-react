import { useState,useContext } from "react";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import { useNavigate } from "react-router-dom";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import Switch from "react-switch";

const Theme = (props:any) => {
    
    const [themeChoice, setThemeChoice] = useState("default")
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "theme"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
    const handleModeChange = (checked:boolean) => {
        setThemeChoice(checked ? "default" : "custom")
    }
    const navigate = useNavigate();
    const handleNavigateToConversations = () => {
        if(themeChoice === "custom")
        {
            navigate("/home/chats-module/conversations-with-messages", {state: {changeThemeToCustom: true}});
        }
        else
        {
            navigate("/home/chats-module/conversations-with-messages", {state: {changeThemeToCustom: false}});
        }
    }    
    const { theme } = useContext(CometChatContext);
    const themeMode = theme.palette.mode
return (
       
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>Theme</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatTheme is a style applied to every component and every view in the activity or component in the UI Kit.
                </div>
                <div className="switch__wrapper" style={{marginTop: "20px", display: "flex", justifyContent: "space-between"}}>
                    <div className="switch__label">
                    Theme
                    </div>
                    <div className="switch__btn">
                        <Switch onChange={handleModeChange}  width={100} offColor="#D422C2" onColor="#777777" uncheckedIcon={<div style={{color:"white",position: "absolute", top: "4px", left: "-21px",}}>Custom</div>} checked={themeChoice === "default" ? true : false} checkedIcon={<div style={{color:"white",position: "absolute", top: "4px",
                        left: "17px",}}>Default</div>}  />
                    </div>
                </div>
                <div className="view_button"><button onClick={handleNavigateToConversations} style={{cursor: "pointer",font: "400 15px Inter, sans-serif", color: "rgb(255, 255, 255)", backgroundColor: "rgb(51, 153, 255)", border: 0, width: "100%",height: "34px",borderRadius: "8px",marginTop:"15px"}} >View</button></div>
              </div>
             </div>)

}
export { Theme };