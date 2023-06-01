import { useContext } from "react";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import { CometChatSoundManager } from 'uikit-utils-lerna';

const SoundManager = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "sound-manager"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true

    const playIncoming = ()=>{
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
    }
    const playOutgoing = ()=>{
        CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
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
                    <div style={componentDetailsModalTitleStyle}>Sound Manager</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in UI Kit. for example, events like incoming and outgoing messages.
                </div>
                <div className="soundManagerDemo" style={{marginTop:"15px", display: "flex",flexDirection: "column",rowGap: "15px"}}>
                    <div className="incoming__sound" style={{display: "flex", justifyContent:" space-between"}}>
                        <div className="sound_name" style={{display: "flex", alignItems: "center",justifyContent: "center", font: "400 15px Inter, sans-serif", color: "inherit"}}>Incoming Messages</div>
                        <div className="play__button"><button onClick={playIncoming} style={{font: "400 15px Inter, sans-serif", backgroundColor: "rgb(51, 153, 255)", border: 0, color:"white", width: "64px",height: "34px",borderRadius: "10px"}} >Play</button></div>
                    </div>
                    <div className="outgoing__sound" style={{display: "flex", justifyContent:" space-between"}}>
                        <div className="sound_name" style={{display: "flex", alignItems: "center",justifyContent: "center", font: "400 15px Inter, sans-serif", color: "inherit"}}>Outgoing Messages</div>
                        <div className="play__button"><button onClick={playOutgoing} style={{font: "400 15px Inter, sans-serif", backgroundColor: "rgb(51, 153, 255)", border: 0, color:"white", width: "64px",height: "34px",borderRadius: "10px"}} >Play</button></div>
                    </div>
                </div>
              </div>
             </div>)

}
export { SoundManager };