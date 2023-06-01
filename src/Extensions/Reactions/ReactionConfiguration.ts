import { OptionsStyle, ReactionsStyle } from "uikit-utils-lerna";

export class ReactionConfiguration {
    private style: ReactionsStyle;
    private addReactionIconURL: string;
    private optionIconURL: string;
    private optionStyle: OptionsStyle;

    constructor(configuration: {style?: ReactionsStyle, addReactionIconURL?: string, optionIconURL?: string, optionStyle?: OptionsStyle}){
        let { style, addReactionIconURL, optionIconURL, optionStyle } = configuration;
        this.style = style as ReactionsStyle;
        this.addReactionIconURL = addReactionIconURL as string;
        this.optionIconURL = optionIconURL as string;
        this.optionStyle = optionStyle as OptionsStyle;
    }

    getReactionsStyle(): ReactionsStyle{
        return this.style;
    }
		
	getAddReactionIconURL(): string{
        return this.addReactionIconURL;
    }

	getOptionIconURL(): string{
        return this.optionIconURL;
    }

    getOptionStyle(): OptionsStyle {
        return this.optionStyle;
    }

}