import { useContext } from "react";
import {  fontHelper } from "uikit-resources-lerna";
import CloseIcon from "../assets/close2x.png";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
const TextBubble = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "text-bubble"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
        const { theme } = useContext(CometChatContext);
        const themeMode = theme.palette.mode
        const receiverBubbleStyle = {
            borderRadius:"8px",
            background:theme.palette.getAccent200(),
            textFont: fontHelper(theme.typography.text2),
            textColor: theme.palette.getAccent(),
          }
          const senderBubbleStyle = {
            borderRadius:"8px",
            background:theme.palette.getPrimary(),
            textFont: fontHelper(theme.typography.text2),
            textColor: theme.palette.getAccent("dark"),
          }

    return (
       
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>Text Bubble</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatTextBubble component displays a text message.
                </div>
                <div className="textBuddleDemo" style={{display: "block", justifyContent:" space-between"}}>
                  <div className="receiver-text" style={{maxWidth: "100px", width: "fit-content"}}>
                      <cometchat-text-bubble text="heyyyyy" textStyle={JSON.stringify(receiverBubbleStyle)} />
                  </div>
                  <div className="sender-text" style={{maxWidth: "100px", width: "fit-content", float: "right"}}>
                      <cometchat-text-bubble text="hello" textStyle={JSON.stringify(senderBubbleStyle)} />
                  </div>
                </div>
              </div>
             </div>)

}
export { TextBubble };