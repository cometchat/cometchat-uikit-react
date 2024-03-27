import { ConfirmDialogStyle } from "@cometchat/uikit-elements";
import { BaseStyle, ImageModerationStyle } from "@cometchat/uikit-shared";
export declare class ImageModerationConfiguration {
    private style;
    private confirmDialogStyle;
    private backDropStyle;
    constructor(configuration: {
        style?: ImageModerationStyle;
        confirmDialogStyle?: ConfirmDialogStyle;
        backDropStyle?: BaseStyle;
    });
    getImageModerationStyle(): ImageModerationStyle;
    getConfirmDialogSyle(): ConfirmDialogStyle;
    getBackDropStyle(): BaseStyle;
}
