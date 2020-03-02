import React from "react";
import "./style.scss";
import GroupView from "../GroupView";
import { CometChatManager } from "./controller";
import { CometChat } from "@cometchat-pro/chat";



class CometChatGroupList extends React.Component {
  timeout;
  constructor(props) {
    super(props);
    this.state = {
      grouplist: [],
      onItemClick: null
    }
    this.getGroupsList = this.getGroupsList.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

  }
  componentDidMount() {
    this.cometChatManager = new CometChatManager();
    this.getGroupsList();
    this.cometChatManager.attachGroupListener(this.groupUpdated);
  }
  // static getDerivedStateFromProps(props,state){    
  //   return props;
  // }
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getGroupsList();
  }

  handleClick = (group) => {
    if (!group.hasJoined) {
      let GUID = group.guid;
      let password = "";
      let groupType = CometChat.GROUP_TYPE.PUBLIC;

      CometChat.joinGroup(GUID, groupType, password).then(
        group => {

          this.props.onItemClick(group, 'group');
        },
        error => {
          console.log("Group joining failed with exception:", error);
        }
      );

    } else {
      this.props.onItemClick(group, 'group');
    }

  }
  searchGroup = (e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    let val = e.target.value;
    this.timeout = setTimeout(() => {
      this.cometChatManager = new CometChatManager(val);
      this.setState({ grouplist: [] }, () => {
        this.getGroupsList();
      })
    }, 500)


  }

  groupUpdated(group) {
    let grouplist = this.state.grouplist;
    grouplist.map((stateGroup, key) => {
      if (stateGroup.uid === group.uid) {
        grouplist.splice(key, 1, group);

        return true;
      }
      return true;
    });
    this.setState({ grouplist });
  }

  getGroupsList() {
    this.cometChatManager.isCometChatUserLogedIn().then(
      group => {
        this.cometChatManager.fetchNextGroups().then(
          (grouplist) => {
            this.setState({ grouplist: [...this.state.grouplist, ...grouplist] });
          },
          error => {
            //TODO Handle the erros in conatct List.
            console.error("Handle the erros in conatct List", error);
          }
        );
      },
      error => {
        //TODO Handle the erros in users logedin state.
        console.error("Handle the erros in conatct List", error);
      }
    );
  }

  displayGroupList() {
    if (this.state.grouplist.length > 0) {
      return this.state.grouplist.map((group, key) => {

        return (
          <div id={key} onClick={() => this.handleClick(group)} key={group.guid}>
            <GroupView key={group.guid} group={group}></GroupView>
            <div className=" row cp-list-seperator"></div>

          </div>
        );

      });

    }
  }
  render() {
    return (
      <div className="cp-grouplist-wrapper">
        <p className="cp-contact-list-title font-extra-large">Groups</p>
        <p className="cp-searchbar">
          <input className="font-normal" onChange={this.searchGroup} type="text" placeholder="Search" aria-label="Search" />
        </p>
        <div className="cp-userlist" onScroll={this.handleScroll}>

          {this.displayGroupList()}
        </div>
      </div>

    );
  }
}



export default CometChatGroupList;
export const cometChatGroupList=CometChatGroupList;

CometChatGroupList.defaultProps = {
  CometChatGroupList: {}
};
