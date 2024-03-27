import { LinkPreviewStyle } from "@cometchat/uikit-shared";
export declare class LinkPreviewConfiguration {
    private style;
    constructor(configuration: {
        style?: LinkPreviewStyle;
    });
    getLinkPreviewStyle(): LinkPreviewStyle;
}
