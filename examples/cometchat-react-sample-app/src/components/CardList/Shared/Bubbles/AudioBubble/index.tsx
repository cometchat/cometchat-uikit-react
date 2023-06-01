
import { useContext } from "react";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import SampleAudio from "./sample.mp3"
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
const AudioBubble = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "audio-bubble"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
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
                    <div style={componentDetailsModalTitleStyle}>Audio Bubble</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatAudioBubble displays a media message containing an audio" "To learn more about this component tap here.
                </div>
                <div className="audiobubbleWrapper" style={{margin: "0 auto",marginTop: "15px", marginBottom: "15px",}}>
                  <cometchat-audio-bubble src={SampleAudio} />
                </div>
              </div>
             </div>)

}
export { AudioBubble };