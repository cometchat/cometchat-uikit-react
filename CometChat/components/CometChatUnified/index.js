import React from "react";
import "./style.scss";
import NavBar from "../NavBar";
import CometChatMessageScreen from "../CometChatMessageScreen"



class CometChatUnified extends React.Component {
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
      <div className={"row cometchat-container " + (this.state.darktheme ? " dark" : " light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
            <NavBar onItemSelected={(item, type) => {
              this.setState({ item, type })
            }}></NavBar>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">
          {
            this.state.item ? <CometChatMessageScreen {...this.state}></CometChatMessageScreen> : <h1 className="cp-center-text">Select a chat to start messaging</h1>

          }
          {/* <label className="switch">
            <input type="checkbox" onChange={this.changeTheme} />
            <span className="slider round"></span>
          </label> */}
        </div>
      </div>
    );
  }
}



export default CometChatUnified;
export const cometChatUnified=CometChatUnified;

CometChatUnified.defaultProps = {
  launch: {}
};
