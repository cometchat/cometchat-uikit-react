import { MessageTranslationStyle, OptionsStyle } from "@cometchat/uikit-shared";
export declare class MessageTranslationConfiguration {
    private style;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: MessageTranslationStyle;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getMessageTranslationStyle(): MessageTranslationStyle;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}
