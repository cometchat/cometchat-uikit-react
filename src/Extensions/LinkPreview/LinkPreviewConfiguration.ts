import { LinkPreviewStyle } from "uikit-utils-lerna";

export class LinkPreviewConfiguration {
    private style: LinkPreviewStyle;

    constructor(configuration: {style?: LinkPreviewStyle}){
        this.style = (configuration.style as LinkPreviewStyle);
    }

    getLinkPreviewStyle(): LinkPreviewStyle{
        return this.style;
    }

}