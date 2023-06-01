import { MessageTranslationStyle, OptionsStyle } from "uikit-utils-lerna";

export class MessageTranslationConfiguration {
    private style: MessageTranslationStyle;
    private optionIconURL: string;
    private optionStyle: OptionsStyle;

    constructor(configuration: {style?: MessageTranslationStyle, optionIconURL?: string, optionStyle?: OptionsStyle}) {
        let { style, optionIconURL, optionStyle } = configuration;
        this.style = (style as MessageTranslationStyle);
        this.optionIconURL = (optionIconURL as string);
        this.optionStyle = (optionStyle as OptionsStyle);
    }

    getMessageTranslationStyle(): MessageTranslationStyle {
        return this.style;
    }

    getOptionIconURL(): string {
        return this.optionIconURL;
    }

    getOptionStyle(): OptionsStyle {
        return this.optionStyle;
    }

}