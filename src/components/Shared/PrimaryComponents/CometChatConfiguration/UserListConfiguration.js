import reloadIcon from "../../../Users/CometChatUserList/resources/spinner.svg"

const UserListConfiguration = function () {
  this.limit = 30;
  this.searchKeyword = "";
  this.status = "";
  this.roles = [];
  this.friendsOnly = false;
  this.hideBlockedUsers = false;
  this.tags = [];
  this.uids = [];
  this.customView = {
    loading: "",
    empty: "",
    error: "",
  };
  this.loadingIconURL = reloadIcon;
  this.hideError = false;
  this.onErrorCallback = () => {};
};

export { UserListConfiguration };
