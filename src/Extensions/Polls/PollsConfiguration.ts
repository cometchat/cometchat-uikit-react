import { CreatePollStyle, OptionsStyle, PollsBubbleStyle } from "uikit-utils-lerna";

export class PollsConfiguration {
    private style: PollsBubbleStyle;
    private createPollStyle: CreatePollStyle
    private createPollIconURL: string;
    private deleteIconURL: string;
    private closeIconURL: string;
    private optionIconURL: string;
    private addAnswerIconURL: string;
    private optionStyle: OptionsStyle;

    constructor(configuration: {style?: PollsBubbleStyle, createPollStyle?: CreatePollStyle, createPollIconURL?: string, deleteIconURL?: string, closeIconURL?: string, optionIconURL?: string, addAnswerIconURL?: string, optionStyle?: OptionsStyle}){
        let { style, createPollStyle, createPollIconURL, deleteIconURL, closeIconURL, optionIconURL, addAnswerIconURL, optionStyle } = configuration;
        this.style = (style as PollsBubbleStyle);
        this.createPollStyle = (createPollStyle as CreatePollStyle);
        this.createPollIconURL = (createPollIconURL as string);
        this.deleteIconURL = (deleteIconURL as string);
        this.closeIconURL = (closeIconURL as string);
        this.optionIconURL = (optionIconURL as string);
        this.addAnswerIconURL = (addAnswerIconURL as string);
        this.optionStyle = (optionStyle as OptionsStyle);
    }

    getPollsBubbleStyle(): PollsBubbleStyle {
        return this.style;
    }

    getCreatePollStyle(): CreatePollStyle {
        return this.createPollStyle;
    }

    getCreatePollIconURL(): string {
        return this.createPollIconURL;
    }

    getDeleteIconURL(): string {
        return this.deleteIconURL;
    }

    getCloseIconURL(): string {
        return this.closeIconURL;
    }

    getOptionIconURL(): string {
        return this.optionIconURL;
    }

    getAddAnswerIconURL(): string {
        return this.addAnswerIconURL;
    }

    getOptionStyle(): OptionsStyle {
        return this.optionStyle;
    }

}