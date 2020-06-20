import React from 'react';

import "./style.scss";

import blueAddMember from "./resources/plus-blue-icon.svg";

class CometChatGroupDetail extends React.Component {

    constructor() {
        super();
        this.state = {

        }
    }

    render() {
        return (
            <div className="ccl-dtls-panel-wrap">
                <div className="ccl-right-panel-head-wrap">
                    <h4 className="ccl-right-panel-head-ttl">Details</h4>
                </div>
                <div className="ccl-dtls-panel-body">
                    <div className="ccl-dtls-noti-sel-wrap">
                        <input type="checkbox" id="notificationSel" autoComplete="off" name="notificationSel" />
                        <label htmlFor="notificationSel">Notifications</label>
                    </div>
                    <div className="ccl-dtls-grp-admin-cnt-wrap">
                        <span className="ccl-dtls-grp-admin-ttl hi">Administrators</span>
                        <span className="ccl-dtls-grp-admin-cnt">2</span>
                    </div>
                    <div className="ccl-dtls-panel-section">
                        <h6 className="ccl-dtls-panel-section-head ccl-text-uppercase">Members</h6>
                        <div className="chat-ppl-list-wrap">
                            <div className="chat-ppl-listitem clearfix add-member">
                                <div className="chat-ppl-thumbnail-wrap">
                                    <img src={blueAddMember} alt="Add Member" />
                                </div>
                                <div className="chat-ppl-listitem-dtls">
                                    <span className="chat-ppl-listitem-name">Add Members</span>                                           
                                </div>
                            </div>
                            <div className="chat-ppl-listitem clearfix">
                                <div className="chat-ppl-thumbnail-wrap">
                                    <img src="./assets/images/people-1_2x.jpg" alt="Avatar" />
                                </div>
                                <div className="chat-ppl-listitem-dtls">
                                    <span className="chat-ppl-listitem-name">Gladys Kanyinda</span>
                                    <span className="chat-ppl-listitem-role">Owner</span>
                                </div>
                            </div>
                            <div className="chat-ppl-listitem clearfix">
                                <div className="chat-ppl-thumbnail-wrap">
                                    <img src="./assets/images/people-1_2x.jpg" alt="Avatar" />
                                </div>
                                <div className="chat-ppl-listitem-dtls">
                                    <span className="chat-ppl-listitem-name">Gladys Kanyinda</span>
                                    <span className="chat-ppl-listitem-role">Admin</span>
                                </div>
                            </div>
                            <div className="chat-ppl-listitem clearfix">
                                <div className="chat-ppl-thumbnail-wrap">
                                    <img src="./assets/images/people-1_2x.jpg" alt="Avatar" />
                                </div>
                                <div className="chat-ppl-listitem-dtls">
                                    <span className="chat-ppl-listitem-name">Gladys Kanyinda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ccl-dtls-panel-section">
                        <h6 className="ccl-dtls-panel-section-head ccl-text-uppercase">Privacy &amp; Support</h6>
                        <div className="ccl-dtls-section-list">
                            <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Delete and Exit</span></div>
                            <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link">Report</span></div>
                        </div>
                    </div>
                    <div className="ccl-dtls-panel-section">
                        <h6 className="ccl-dtls-panel-section-head ccl-text-uppercase">Shared Media</h6>
                        <div className="ccl-dtls-panel-media-fltr-wrap">
                            <div className="ccl-dtls-panel-media-fltrs clearfix">
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center active" data-mediatype="typePhotos">Photos</span>
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center" data-mediatype="typeLinks">Links</span>
                                <span className="ccl-dtls-panel-media-fltr-btn ccl-center" data-mediatype="typeDocs">Docs</span>
                            </div>
                            <div className="ccl-dtls-panel-media-type-wrap">
                                <div className="ccl-dtls-panel-media-type-wrap photos clearfix" id="typePhotos">
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/texture-pic1.jpg" alt="Media Item" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/texture-pic2.jpg" alt="Media Item" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/texture-pic1.jpg" alt="Media Item" /></div>
                                    <div className="ccl-dtls-panel-media-item"><img src="./assets/images/texture-pic2.jpg" alt="Media Item" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CometChatGroupDetail;