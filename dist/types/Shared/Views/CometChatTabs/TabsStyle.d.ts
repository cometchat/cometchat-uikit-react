import { BaseStyle } from "@cometchat/uikit-shared";
/**
 * TabsStyle
 *
 * @property {string} height - The height of the component.
 * @property {string} width - The width of the component.
 * @property {string} border - The border of the component.
 * @property {string} borderRadius - The border radius of the component.
 * @property {string} background - The background color of the component.
 * @property {string} tabListHeight - The height of the tab list.
 * @property {string} tabListWidth - The width of the tab list.
 * @property {string} tabListBorder - The border of the tab list.
 * @property {string} tabListBorderRadius - The border radius of the tab list.
 * @property {string} tabListBackground - The background color of the tab list.
 * @property {string} tabListBoxShadow - The box shadow of the tab list.
 * @property {string} tabListPadding - The padding of the tab list.
 * @property {string} tabPaneWidth - The width of the tab pane.
 * @property {string} tabPaneHeight - The height of the tab pane.
 */
export declare class TabsStyle extends BaseStyle {
    tabListHeight?: string;
    tabListWidth?: string;
    tabListBorder?: string;
    tabListBorderRadius?: string;
    tabListBackground?: string;
    tabListBoxShadow?: string;
    tabListPadding?: string;
    tabPaneWidth?: string;
    tabPaneHeight?: string;
    constructor(props: Partial<TabsStyle>);
}
