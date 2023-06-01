import {  useContext} from "react";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import {Receipts,CometChatContext} from "@cometchat-pro/react-ui-kit"
import {componentDetailsModalStyle} from "./style"

export const Receipt = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "receipt"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
    const  receipt:typeof Receipts = Receipts
    const { theme } = useContext(CometChatContext);
    const themeMode = theme.palette.mode
    const boxColor = themeMode === "dark" ? "#ccc" :"#464545"
    return (
       
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>Message Receipt</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message..
                </div>
                <div className="receipt__container" style={{display: "flex", flexDirection: "row", columnGap: "15px", marginTop: "15px", justifyContent: "space-between"}}>
                    <div className="receipt__box" style={{border: "1px solid #ddd",padding: "15px",color: boxColor,fontSize: "14px",borderRadius:"8px",minWidth: "150px"}}>
                        <div>Progress Status</div>
                        <div style={{display: "flex",alignItems: "center",justifyContent: "center",margin: "8px",}}> <cometchat-receipt receipt={receipt.wait}></cometchat-receipt></div>
                    </div>   
                    <div className="receipt__box" style={{border: "1px solid #ddd",padding: "15px",color:  boxColor,fontSize: "14px",borderRadius:"8px",minWidth: "150px"}}>
                        <div>Sent Receipt</div>
                        <div style={{display: "flex",alignItems: "center",justifyContent: "center",margin: "8px",}}> <cometchat-receipt receipt={receipt.sent}></cometchat-receipt></div>
                    </div>   
                    <div className="receipt__box" style={{border: "1px solid #ddd",padding: "15px",color:  boxColor,fontSize: "14px",borderRadius:"8px",minWidth: "150px"}}>
                        <div>Delivered Receipt</div>
                        <div style={{display: "flex",alignItems: "center",justifyContent: "center",margin: "8px",}}> <cometchat-receipt receipt={receipt.delivered}></cometchat-receipt></div>
                    </div> 
                </div>
                <div className="receipt__container" style={{display: "flex", flexDirection: "row", columnGap: "28px", marginTop: "15px", justifyContent: "flex-start"}}>
                    <div className="receipt__box" style={{border: "1px solid #ddd",padding: "15px",color:  boxColor,fontSize: "14px",borderRadius:"8px",minWidth: "150px"}}>
                        <div>Read Receipt</div>
                        <div style={{display: "flex",alignItems: "center",justifyContent: "center",margin: "8px",}}> <cometchat-receipt receipt={receipt.read}></cometchat-receipt></div>
                    </div>   
                    <div className="receipt__box" style={{border: "1px solid #ddd",padding: "15px",color:  boxColor,fontSize: "14px",borderRadius:"8px",minWidth: "150px"}}>
                        <div>Error Status</div>
                        <div style={{display: "flex",alignItems: "center",justifyContent: "center",margin: "8px",}}> <cometchat-receipt receipt={receipt.error}></cometchat-receipt></div>
                    </div>   
                </div>
              </div>
        </div>)

}