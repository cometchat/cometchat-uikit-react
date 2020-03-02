import React from "react";
import "./style.scss";
import CometChatMessageScreen from "../CometChatMessageScreen"
import CometChatConversationList from "../CometChatConversationList";



class CometChatConversationListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      darktheme: false
    }

  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }

  changeTheme = (e) => {
    this.setState({
      darktheme: !this.state.darktheme
    })
  }


  render() {
    return (
      <div className={"row cometchat-container " + (this.state.darktheme ? "dark" : "light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
           
            <CometChatConversationList onItemClick={(item, type) => {
              this.setState({ item, type })
            }}></CometChatConversationList>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">
          {
            this.state.item ? <CometChatMessageScreen {...this.state}></CometChatMessageScreen> : <h1 className="cp-center-text">Select a chat to start messaging</h1>

          }
          <label className="switch">
            <input type="checkbox" onChange={this.changeTheme} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    );
  }
}



export default CometChatConversationListScreen;
export const cometChatConversationListScreen=CometChatConversationListScreen;

CometChatConversationListScreen.defaultProps = {
  launch: {}
};
