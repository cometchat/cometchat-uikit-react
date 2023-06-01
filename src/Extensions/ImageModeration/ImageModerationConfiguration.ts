import { ConfirmDialogStyle } from "my-cstom-package-lit";
import { BaseStyle, ImageModerationStyle } from "uikit-utils-lerna";

export class ImageModerationConfiguration {
    private style: ImageModerationStyle;
    private confirmDialogStyle: ConfirmDialogStyle;
    private backDropStyle: BaseStyle;

    constructor(configuration: {
        style?: ImageModerationStyle, 
        confirmDialogStyle?: ConfirmDialogStyle;
        backDropStyle?: BaseStyle;
    }) {
        this.style = configuration.style as ImageModerationStyle;
        this.confirmDialogStyle = configuration.confirmDialogStyle as ConfirmDialogStyle;
        this.backDropStyle = configuration.backDropStyle as BaseStyle;
    }

    getImageModerationStyle(): ImageModerationStyle{
        return this.style;
    }

    getConfirmDialogSyle(): ConfirmDialogStyle{
        return this.confirmDialogStyle;
    }
    
    getBackDropStyle(): BaseStyle{
        return this.backDropStyle;
    }

}