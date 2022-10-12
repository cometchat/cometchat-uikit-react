import * as styles from "./Styles";
import { CometChatDataItem } from "@cometchat-pro/react-ui-kit";

export const DataItem = (props) => {

    const {
        theme
    } = props;

    const user = {
        name: "Captain America",
        avatar: "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
        uid: "uid123",
        status: "online"
    };

    const group = {
        name: "Super Surfers",
        membersCount: 12,
        guid: "new__group123",
        type: "private",
        icon: null

    };
    const inputdata = {
        thumbnail: true,
        title: true,
    }
    const groupInputdata = {
        thumbnail: true,
        title: true,
        status: true
    }


    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatDataItem is used to display the user list item & group list item in a user list & group list respectively. It houses the Avatar, Status indicator and Title
            </div>

            <div style={styles.wrapperStyle()}>
                <div class="details__container">
                    <div class="user__data">
                        <span class="section__header" style={styles.sectionHeaderStyle(theme)}>User</span>
                        <div class="data__item">
                            <CometChatDataItem user={user} inputData={inputdata} />
                        </div>
                    </div>
                    <div class="group__data">
                        <span class="section__header" style={styles.sectionHeaderStyle(theme)}>Group</span>
                        <div class="data__item">
                            <CometChatDataItem inputData={groupInputdata} group={group} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}