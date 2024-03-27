import { SmartRepliesStyle } from "@cometchat/uikit-shared";
export declare class SmartRepliesConfiguration {
    private style;
    constructor(configuration: {
        style?: SmartRepliesStyle;
    });
    getSmartRepliesStyle(): SmartRepliesStyle;
}
