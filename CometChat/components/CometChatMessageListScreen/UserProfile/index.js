import React from "react";
import "./style.scss";

const userprofile = (props) => {

  let txtDisplay;
  
  if(props.item.blockedByMe) {
    txtDisplay = (<button onClick={() => props.actionGenerated("unblockUser")} className="cp-block-user-button">Unblock User</button>);
  } else {
    txtDisplay = (<button onClick={() => props.actionGenerated("blockUser")} className="cp-block-user-button">Block User</button>);
  }

  return (

    <div className="cp-user-profile-scroll">
      <p className="cp-profile-list-title font-extra-large">Details</p>
      <div className="cp-profile-view">
        <div className="cp-username cp-ellipsis font-bold">Notifications</div>
      </div>

      <div className="cp-user-block">
        <p className="text-muted">Privacy and Support</p>
        <div className="row">
        <div className="col cp-user-block-info">
        {
          props.type === 'user' ? <div className="cp-username cp-ellipsis font-bold">{txtDisplay}</div> : ""
        }
        </div>
        </div>
      </div>
    </div>

  );

}

export default React.memo(userprofile);