import { useState , useContext} from "react";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import { useNavigate } from "react-router-dom";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import Switch from "react-switch";
import { CometChatLocalize } from "uikit-resources-lerna";

const Localize = (props:any) => {
    const [languageChoice, setLanguageChoice] = useState("english")
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "localize"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
    const handleChange = (checked:boolean) => {
        setLanguageChoice(checked ? "english" : "hindi")
        CometChatLocalize.setLocale(checked ? "en" : "hi")
    }
    const navigate = useNavigate();
    const handleNavigateToConversations = () => {
        navigate("/home/chats-module/conversations-with-messages");
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
                    <div style={componentDetailsModalTitleStyle}>Localize</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the language accordingly.
                </div>
                <div className="switch__wrapper" style={{marginTop: "20px", display: "flex", justifyContent: "space-between"}}>
                    <div className="switch__label">
                    Language
                    </div>
                    <div className="switch__btn">
                        <Switch onChange={handleChange}  width={100} offColor="#777777" onColor="#bbbbb" uncheckedIcon={<div style={{color:"white",position: "absolute", top: "4px", left: "-21px",}}>हिन्दी</div>} checked={languageChoice === "english" ? true : false} checkedIcon={<div style={{color:"white",position: "absolute", top: "4px",
                        left: "17px",}}>English</div>}  />
                    </div>
                </div>
                <div className="view_button"><button onClick={handleNavigateToConversations} style={{cursor: "pointer",font: "400 15px Inter, sans-serif", color: "rgb(255, 255, 255)", backgroundColor: "rgb(51, 153, 255)", border: 0, width: "100%",height: "34px",borderRadius: "8px",marginTop:"15px"}} >View</button></div>
              </div>
             </div>)

}
export { Localize };