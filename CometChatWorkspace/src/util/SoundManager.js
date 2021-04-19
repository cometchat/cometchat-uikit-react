import * as enums from "./enums";
import { validateWidgetSettings } from "./common";

export class SoundManager {

    static widgetSettings;
    static incomingCallAudio = null;
    static outgoingCallAudio = null;
    static incomingMessageAudio = null;
    static outgoingMessageAudio = null;
    static incomingOtherMessageAudio = null;

    static setWidgetSettings = (widgetSettings) => {
        this.widgetSettings = widgetSettings;
    }

    static play = (action) => {

        switch (action) {
            case enums.CONSTANTS.AUDIO["INCOMING_CALL"]: {

                //if call sound is disabled in chat widget
                if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_calls") === false) {
                    return false;
                }

                if (this.incomingCallAudio === null) {

                    import("../resources/audio/incomingcall.wav").then(response => {

                        this.incomingCallAudio = new Audio(response.default);
                        this.playCallAlert(this.incomingCallAudio);
                    });

                } else {
                    this.playCallAlert(this.incomingCallAudio);
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["OUTGOING_CALL"]: {

                //if call sound is disabled in chat widget
                if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_calls") === false) {
                    return false;
                }

                if (this.outgoingCallAudio === null) {

                    import("../resources/audio/outgoingcall.wav").then(response => {

                        this.outgoingCallAudio = new Audio(response.default);
                        this.playCallAlert(this.outgoingCallAudio);
                    });
                } else {
                    this.playCallAlert(this.outgoingCallAudio);
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["INCOMING_MESSAGE"]: {

                //if message sound is disabled for chat wigdet in dashboard
                if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_messages") === false) {
                    return false;
                }

                if (this.incomingMessageAudio === null) {

                    import("../resources/audio/incomingmessage.wav").then(response => {

                        this.incomingMessageAudio = new Audio(response.default);
                        this.playMessageAlert(this.incomingMessageAudio);
                    });

                } else {
                    this.playMessageAlert(this.incomingMessageAudio);
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"]: {

                //if message sound is disabled for chat wigdet in dashboard
                if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_messages") === false) {
                    return false;
                }

                if (this.incomingOtherMessageAudio === null) {

                    import("../resources/audio/incomingothermessage.wav").then(response => {

                        this.incomingOtherMessageAudio = new Audio(response.default);
                        this.playMessageAlert(this.incomingOtherMessageAudio);
                    });

                } else {
                    this.playMessageAlert(this.incomingOtherMessageAudio);
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["OUTGOING_MESSAGE"]: {

                //if message sound is disabled for chat wigdet in dashboard
                if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_messages") === false) {
                    return false;
                }

                if (this.outgoingMessageAudio === null) {

                    import("../resources/audio/outgoingmessage.wav").then(response => {

                        this.outgoingMessageAudio = new Audio(response.default);
                        this.playMessageAlert(this.outgoingMessageAudio);
                    });

                } else {
                    this.playMessageAlert(this.outgoingMessageAudio);
                }
                break;
            }
            default:
                break;
        }
    }

    static pause = (action) => {

        //if audio sound is disabled in chat widget
        if (validateWidgetSettings(this.widgetSettings, "enable_sound_for_calls") === false) {
            return false;
        }

        switch (action) {
            case enums.CONSTANTS.AUDIO["INCOMING_CALL"]: {

                if (this.incomingCallAudio) {
                    this.incomingCallAudio.pause();
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["OUTGOING_CALL"]: {

                if (this.outgoingCallAudio) {
                    this.outgoingCallAudio.pause();
                }
                break;
            }
            case enums.CONSTANTS.AUDIO["INCOMING_MESSAGE"]:
            case enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"]:
            case enums.CONSTANTS.AUDIO["OUTGOING_MESSAGE"]:
            default:
                break;
        }
    }

    static playCallAlert = (callAudio) => {

        try {

            callAudio.currentTime = 0;
            if (typeof callAudio.loop == 'boolean') {
                callAudio.loop = true;
            } else {
                callAudio.addEventListener('ended', function () {
                    this.currentTime = 0;
                    this.play();
                }, false);
            }
            callAudio.play();

        } catch (error) {

        }
    }

    static pauseCallAlert = (callAudio) => {
        callAudio.pause();
    }

    static playMessageAlert = (messageAudio) => {
        messageAudio.currentTime = 0;
        messageAudio.play();
    }

    static pauseMessageAlert = (messageAudio) => {
        messageAudio.pause();
    }
}