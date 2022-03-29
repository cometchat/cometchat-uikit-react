import spinner from "../../../Groups/CometChatGroupList/resources/spinner.svg"

const GroupListConfiguration = function () {
  this.limit = 30;
  this.searchKeyword = "";
  this.joinedOnly = false;
  this.tags = [];
  this.hideError = false;
  this.customView = {
    loading: "",
    empty: "",
    error: "",
  };
  this.loadingIconURL = spinner;
  this.onErrorCallBack = () => {};
};

export { GroupListConfiguration };
