

import { useState,useContext } from "react";
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";
import { avatarWrapperStyle,inputStyle } from "./style";
import Switch from "react-switch";
import {CometChatContext,fontHelper} from "@cometchat-pro/react-ui-kit"

const Avatar = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "avatar"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true
    const [avatarChoice, setAvatarChoice] = useState("image")
    const [avatarBorderRadius, setAvatarBorderRadius] = useState("28")
    const handleChange = (checked:boolean) => {
     
      setAvatarChoice(checked ? "image" : "name")
    }
    const handleInputChange = (value:string) => {
      setAvatarBorderRadius(value)
    }
    const { theme } = useContext(CometChatContext);
    const themeMode = theme.palette.mode
    let avatarStyle = {
        borderRadius: `${avatarBorderRadius}px`,
        width: "36px",
        height: "36px",
        border: "1px solid #eee",
        backgroundColor: "transparent",
        backgroundSize: "cover",
        nameTextColor: theme.palette.getAccent900(),
        nameTextFont: fontHelper(theme.typography.subtitle1),
        outerViewBorder: "",
        outerViewBorderSpacing: "",
    }
    if(avatarChoice === "name")
    {
      avatarStyle.backgroundColor = "#6929ca"
    }
    return (
       
        <div
              style = {loadingComponentModalStyle(showModal)}
            >
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>Avatar</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                CometChatAvatar component displays an image or user/group avatar with fallback to the first two letters of the user name/group name.
                </div>
                <div style={avatarWrapperStyle}>
                  {avatarChoice === "image" && (<cometchat-avatar image="https://data-us.cometchat.io/assets/images/avatars/ironman.png"  avatarStyle={JSON.stringify(avatarStyle)} />) }
                  {avatarChoice === "name" && (<cometchat-avatar name="Iron Man" avatarStyle={JSON.stringify(avatarStyle)} />) }
                  <input placeholder="Border radius (px)" style={inputStyle(themeMode)} type="number" value={avatarBorderRadius} onChange={(e) => handleInputChange(e.target.value)} />
                </div>
                <div className="switch__wrapper" style={{marginTop: "15px", display: "flex", justifyContent: "space-between"}}>
                    <div className="switch__label">
                    Avatar type
                    </div>
                    <div className="switch__btn">
                        <Switch onChange={handleChange}  width={100} offColor="#777777" onColor="#bbbbb" uncheckedIcon={<div style={{color:"white",position: "absolute", top: "4px", left: "-21px",}}>Name</div>} checked={avatarChoice === "image" ? true : false} checkedIcon={<div style={{color:"white",position: "absolute", top: "4px",
                        left: "17px",}}>Image</div>}  />
                    </div>
                </div>
              </div>
             </div>)

}
export { Avatar };