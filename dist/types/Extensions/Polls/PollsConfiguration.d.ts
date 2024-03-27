import { CreatePollStyle, OptionsStyle, PollsBubbleStyle } from "@cometchat/uikit-shared";
export declare class PollsConfiguration {
    private style;
    private createPollStyle;
    private createPollIconURL;
    private deleteIconURL;
    private closeIconURL;
    private optionIconURL;
    private addAnswerIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: PollsBubbleStyle;
        createPollStyle?: CreatePollStyle;
        createPollIconURL?: string;
        deleteIconURL?: string;
        closeIconURL?: string;
        optionIconURL?: string;
        addAnswerIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getPollsBubbleStyle(): PollsBubbleStyle;
    getCreatePollStyle(): CreatePollStyle;
    getCreatePollIconURL(): string;
    getDeleteIconURL(): string;
    getCloseIconURL(): string;
    getOptionIconURL(): string;
    getAddAnswerIconURL(): string;
    getOptionStyle(): OptionsStyle;
}
