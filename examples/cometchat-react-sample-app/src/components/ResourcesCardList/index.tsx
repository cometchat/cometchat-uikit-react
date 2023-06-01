import { ICardProps } from "../Card";
import SoundSmall from "../../assets/sound-small.png";
import Theme from "../../assets/theme.png";
import Localize from "../../assets/localize.png";
import { CardList } from "../CardList";
import { fontHelper } from "uikit-resources-lerna";
import { useContext } from "react";
import { CometChatContext } from "@cometchat-pro/react-ui-kit";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "sound manager",
        description: "CometChatSoundManager allows you to play different types of audio which is required for incoming and outgoing events in the UI kit.",
        imageInfo: {
            url: SoundSmall,
            altText: "sound"
        }
    },
    {
        title: "theme",
        description: "CometChatTheme is a style applied to every component and every view in the activity or component in the UI kit.",
        imageInfo: {
            url: Theme,
            altText: "theme"
        }
    },
    {
        title: "localize",
        description: "CometChatLocalize allows you to detect the language of your users based on their browser or device settings and set the language accordingly.",
        imageInfo: {
            url: Localize,
            altText: "language"
        }
    }
];

export function ResourcesCardList() {
    const { theme } = useContext(CometChatContext);

    return (
        <CardList 
            title = "resources"
            cardDataList = {cardDataList}
            titleStyle = {{
                font: fontHelper(theme.typography.subtitle2),
                color: theme.palette.getAccent400()
            }}
        />
    );
}
