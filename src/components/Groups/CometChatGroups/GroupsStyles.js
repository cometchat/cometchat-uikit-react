import { BaseStyles } from "../../Shared";

export class GroupsStyles extends BaseStyles {
    constructor({
        width = "280px",
        height = "",
        background = "",
        border = "",
        borderRadius = "",
        titleFont = "",
        titleColor = "",
        backIconTint = "",
        createGroupIconTint = "",
        searchBorder = "",
        searchBorderRadius = "",
        searchBackground = "",
        searchTextFont = "",
        searchTextColor = "",
        searchIconTint = ""
    }) {
        super({
            width,
			height,
			background,
			border,
			borderRadius,  
        })
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.backIconTint = backIconTint;
        this.createGroupIconTint = createGroupIconTint;
        this.searchBorder = searchBorder;
        this.searchBorderRadius = searchBorderRadius;
        this.searchBackground = searchBackground;
        this.searchTextColor = searchTextColor;
        this.searchTextFont = searchTextFont;
        this.searchIconTint = searchIconTint
    }

}