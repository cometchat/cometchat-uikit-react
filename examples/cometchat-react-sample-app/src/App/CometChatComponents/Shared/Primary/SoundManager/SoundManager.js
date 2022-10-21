import { CometChatSoundManager } from "@cometchat-pro/react-ui-kit";
import * as styles from "./Styles";

export const SoundManager = (props) => {

    const {
        theme
    } = props;

    const playIncoming = () => {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
    }
    const playOutgoing = () => {
        CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
    }

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in UI Kit. for example, events like incoming and outgoing messages.
            </div>

            <div className="footer">
                <div className="switch__button" style={styles.switchButtonsStyle(theme)}>
                    <span className="mode__title" style={styles.modeTitleStyle(theme)}>Incoming Messages</span>
                    <button style={styles.btnStyle(theme)} onClick={playIncoming.bind(this)}>Play</button>
                </div>

                <div className="switch__button" style={styles.switchButtonsStyle(theme)}>
                    <span className="mode__title" style={styles.modeTitleStyle(theme)}>Outgoing Messages</span>
                    <button style={styles.btnStyle(theme)} onClick={playOutgoing.bind(this)}>Play</button>
                </div>
            </div>
        </div>
    )
}