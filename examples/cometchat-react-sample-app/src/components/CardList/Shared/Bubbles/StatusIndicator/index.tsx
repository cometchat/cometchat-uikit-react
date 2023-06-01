

import { useContext, useState } from "react";
import CloseIcon from "../assets/close2x.png";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import { statusIndicatorStyle, statusIndicatorWrapperStyle } from "./style";
import Switch from "react-switch";

const StatusIndicator = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "status-indicator"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
    const { theme } = useContext(CometChatContext);
    const themeMode = theme.palette.mode
    const colorOnline = theme.palette.getSuccess()
    const colorOffline = theme.palette.getAccent600()
   
    const [toggleState, setToggleState] = useState(true)
    const handleChange = (checked:boolean) => {
        setToggleState(checked)
    }
    return (
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>StatusIndicator</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                StatusIndicator component indicates whether a user is online or offline..
                </div>
                {toggleState && (  <div className="status" style={statusIndicatorWrapperStyle()}>
                    <cometchat-status-indicator backgroundColor={colorOnline} statusIndicatorStyle={JSON.stringify(statusIndicatorStyle())} />
                </div>)}
                {!toggleState && (   <div className="status" style={statusIndicatorWrapperStyle()}>
                    <cometchat-status-indicator backgroundColor={colorOffline} statusIndicatorStyle={JSON.stringify(statusIndicatorStyle())} />
                </div>)}
                
                <div className="switch__wrapper" style={{display: "flex", justifyContent: "space-between"}}>
                    <div className="switch__label">
                    Status
                    </div>
                    <div className="switch__btn">
                        <Switch width={100} offColor="#777777" onColor="#01c86f" uncheckedIcon={<div style={{color:"white",position: "absolute",
                        top: "4px",
                        left: "-21px",}}>Offline</div>} checkedIcon={<div style={{color:"white",position: "absolute",
                        top: "4px",
                        left: "17px",}}>Online</div>} onChange={handleChange} checked={toggleState} />
                    </div>
                </div>
              </div>
             </div>)
}
export { StatusIndicator };