import { SmartRepliesStyle } from "uikit-utils-lerna";

export class SmartRepliesConfiguration {
    private style: SmartRepliesStyle;

    constructor(configuration: {style?: SmartRepliesStyle}){
        this.style = (configuration.style as SmartRepliesStyle);
    }

    getSmartRepliesStyle(): SmartRepliesStyle{
        return this.style;
    }

}