import React from "react";

import "./style.scss";

class CometChatUserDetail extends React.Component {

    render () {

        let blockUserDisplay;
  
        if(this.props.item.blockedByMe) {
            blockUserDisplay = (
                <span className="ccl-dtls-section-listitem-link" onClick={() => this.props.actionGenerated("unblockUser")}>Unblock User</span>
            );
        } else {
            blockUserDisplay = (
                <span className="ccl-dtls-section-listitem-link" onClick={() => this.props.actionGenerated("blockUser")}>Block User</span>
            );
        }

        return (
            <div className="ccl-dtls-panel-wrap">
                <div className="ccl-right-panel-head-wrap">
                    <h4 className="ccl-right-panel-head-ttl">Details</h4>
                    <div className="cc1-right-panel-close" onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
                </div>
                <div className="ccl-dtls-panel-body">
                    {/* <div className="ccl-dtls-noti-sel-wrap">
                        <input type="checkbox" id="notificationSel" className="css-checkbox" autoComplete="off" name="notificationSel" />
                        <label htmlFor="notificationSel" className="ccl-semi-bold-text">Notifications</label>
                    </div>
                    <div className="ccl-dtls-panel-section actions">
                        <h6 className="ccl-dtls-panel-section-head ccl-secondary-color ccl-text-uppercase">Actions</h6>
                        <div className="ccl-dtls-section-list">
                            <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Search in Conversation</span></div>
                            <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Create Group</span></div>
                        </div>
                    </div> */}
                    <div className="ccl-dtls-panel-section privacy">
                        <h6 className="ccl-dtls-panel-section-head">Options</h6>
                        <div className="ccl-dtls-section-list">
                            {/* <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Clear Chat</span></div> */}
                            <div className="ccl-dtls-section-listitem">{blockUserDisplay}</div>
                            {/* <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Report</span></div> */}
                        </div>
                    </div>
                    {/* <div className="ccl-dtls-panel-section">
                        <h6 className="ccl-dtls-panel-section-head ccl-secondary-color ccl-text-uppercase">Shared Media</h6>
                        <div className="ccl-dtls-panel-media-fltr-wrap">
                            <div className="ccl-dtls-panel-media-fltrs clearfix">
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center active" data-mediatype="typePhotos">Photos</span>
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center" data-mediatype="typeLinks">Links</span>
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center" data-mediatype="typeDocs">Docs</span>
                            </div>
                            <div className="ccl-dtls-panel-media-type-wrap">
                                <div className="ccl-dtls-panel-media-type-wrap photos clearfix" id="typePhotos">
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/media-photos-1_2x.jpg" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/media-photos-2_2x.jpg" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/media-photos-1_2x.jpg" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/media-photos-2_2x.jpg" /></div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        );
    }
}

export default CometChatUserDetail;