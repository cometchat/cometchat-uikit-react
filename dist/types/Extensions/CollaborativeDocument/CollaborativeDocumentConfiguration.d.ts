import { DocumentBubbleStyle } from "@cometchat/uikit-elements";
import { OptionsStyle } from "@cometchat/uikit-shared";
export declare class CollaborativeDocumentConfiguration {
    private style;
    private iconURL;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: DocumentBubbleStyle;
        iconURL?: string;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getDocumentBubbleStyle(): DocumentBubbleStyle;
    getIconURL(): string;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}
