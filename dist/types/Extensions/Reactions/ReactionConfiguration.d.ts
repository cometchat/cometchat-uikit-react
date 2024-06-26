import { OptionsStyle, ReactionsStyle } from "@cometchat/uikit-shared";
export declare class ReactionConfiguration {
    private style;
    private addReactionIconURL;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: ReactionsStyle;
        addReactionIconURL?: string;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getReactionsStyle(): ReactionsStyle;
    getAddReactionIconURL(): string;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}
