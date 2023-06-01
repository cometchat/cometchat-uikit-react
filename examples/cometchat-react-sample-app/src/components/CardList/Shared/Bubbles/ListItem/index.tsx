import { useContext } from "react";
import {CometChatContext} from "@cometchat-pro/react-ui-kit"
import CloseIcon from "../assets/close2x.png";
import { loadingComponentModalStyle, componentDetailsModalStyle,componentDetailsModalHeaderStyle,componentDetailsModalDescriptionStyle,componentDetailModalCloseIconStyle,componentDetailsModalTitleStyle,componentDetailsModalCloseIconWrapperStyle } from "../../style";

type CardData = {
  id : string,
  title : string,
  avatarURL: string,
  subtitleView: JSX.Element,
  tailView: JSX.Element,
  statusIndicatorColor:string,
};

const users = {
    superhero1:{
        uid: "superhero1",
        name: "Iron Man",
        avatar: "https://data-us.cometchat.io/assets/images/avatars/ironman.png",
        status:"offline",
        unreadCount: 0
    },
    superhero2:{
        uid: "superhero2",
        name: "Captain America",
        avatar: "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png", 
        status:"online",
        unreadCount: 30
    }
}

const groups = {
    supergroup:{
        guid: "supergroup",
        name: "Comic Heros' Hangout",
        avatar: "https://data-us.cometchat.io/assets/images/avatars/supergroup.png",
        memberCount: "16",
        unreadCount: 0,
    }
}

    let badgeStyle = {
        textColor: "white",
        background:"#5aaeff",
        borderRadius:"16px",
        width:"fit-content",
        height:"16px",
        border: "none"
    }
const cardDataList : CardData[] = [
    {
        id: users.superhero1.uid,
        title: users.superhero1.name,
        avatarURL: users.superhero1.avatar,
        statusIndicatorColor: users.superhero1.status === "online" ? "lightGreen" : "grey",
        subtitleView: <></>,
        tailView: users.superhero1.unreadCount > 0 ? <div style={{display: "flex",flexDirection: "column",justifyContent: "flex-start",alignItems: "center",}}> <cometchat-date timestamp="192539273647" /> <cometchat-badge count={users.superhero1.unreadCount} badgeStyle={JSON.stringify(badgeStyle)}></cometchat-badge></div> : <></>,
    },
    {
        id: groups.supergroup.guid,
        title: groups.supergroup.name,
        avatarURL: groups.supergroup.avatar,
        statusIndicatorColor: "",
        subtitleView: <div style={{font: "400 13px Inter, sans-serif",color: "inherit"}}>{groups.supergroup.memberCount} members</div>,
        tailView: <></>
    },
    {
        id: users.superhero2.uid,
        title: users.superhero2.name,
        avatarURL: users.superhero2.avatar,
        statusIndicatorColor: users.superhero2.status === "online" ? "lightGreen" : "grey",
        subtitleView: <div style={{font: "400 13px Inter, sans-serif",color: "inherit"}}>Hello Stark!</div>,
        tailView: users.superhero2.unreadCount > 0 ? <div style={{display: "flex",flexDirection: "column",justifyContent: "flex-start",alignItems: "center",}}> <cometchat-date dateStyle={{color: "grey"}} timestamp="192539273647" /> <cometchat-badge count={users.superhero2.unreadCount} badgeStyle={JSON.stringify(badgeStyle)}></cometchat-badge></div> : <></>,
    },
];

let avatarStyle = {
    borderRadius: "28px",
    width: "36px",
    height: "36px",
    border: "1px solid #eee",
    backgroundColor: "transparent",
    backgroundSize: "cover",
    outerViewBorder: "",
    outerViewBorderSpacing: "",
}


const ListItem = (props:any) => {
    const {
        activeComponent,
        handleCloseComponentModal,
        showComponentModal,
    } = props;
    let showModal = false;
    const bubbleSlug = "list-item"
    if(showComponentModal && activeComponent === bubbleSlug)
        showModal = true

    const  listItemStyle = {
        "height": "100%",
        "width": "100%",
    }
    const { theme } = useContext(CometChatContext);
    const themeMode = theme.palette.mode
    return (
       
          <div style = {loadingComponentModalStyle(showModal)}>
              <div
              style={componentDetailsModalStyle(themeMode)}
              >
                <div style={componentDetailsModalHeaderStyle}>
                    <div style={componentDetailsModalTitleStyle}>List Item</div>
                    <div onClick={handleCloseComponentModal} style={componentDetailsModalCloseIconWrapperStyle}><img style={componentDetailModalCloseIconStyle} alt="closeIcon" src={CloseIcon} /></div>
                </div>
                <div style={componentDetailsModalDescriptionStyle}>
                List Item displays data on a tile and that tile may contain leading, trailing, title and subtitle widgets.
                </div>
                <div className="details__container" style={{marginTop: "11px",marginBottom: "8px"}} >
                   
                    <div>
                        {
                            cardDataList.map(cardData =>  {
                                return (        
                                    <cometchat-list-item
                                    avatarStyle={JSON.stringify(avatarStyle)}
                                    id = {cardData.id}
                                    avatarURL = {cardData.avatarURL}
                                    title = {cardData.title}
                                    hideSeparator = "true"
                                    statusIndicatorColor={cardData.statusIndicatorColor}
                                    listItemStyle = {JSON.stringify(listItemStyle)}
                                    hideShowTail={true}
                                ><div 
                                style={{color: themeMode === "dark"? "rgba(255, 255, 255, 0.58)" : "rgba(20, 20, 20, 0.58)"}}
                                slot = "subtitleView"
                            >
                               {cardData.subtitleView}
                            </div>
                                <div 
                                    slot = "tailView"
                                    style={{color: themeMode === "dark"? "rgba(255, 255, 255, 0.58)" : "rgba(20, 20, 20, 0.58)"}}
                                >
                                {cardData.tailView}
                                </div>
                            </cometchat-list-item>   
                                )
                                } 
                            )}
                    </div>
                    </div>
                </div>
              </div>
          )

}
export { ListItem };