import { BaseStyle, TabItemStyle } from "uikit-utils-lerna";
import { TabAlignment } from "uikit-resources-lerna";
import { CSSProperties } from "react";

export const ButtonStyle = (style: TabItemStyle, active: boolean) => {
    return {
        background: active ? style?.activeBackground ?? style?.background : style?.background,
        buttonTextFont: active ? style?.activeTitleTextFont ?? style?.titleTextFont : style?.titleTextFont,
        buttonTextColor: active ? style?.activeTitleTextColor ?? style?.titleTextColor : style?.titleTextColor,
        buttonIconTint: active ? style?.activeIconTint ?? style?.iconTint : style?.iconTint,
        height: style?.height,
        width: style?.width,
        border: style?.border,
        borderRadius: style?.borderRadius,
        gap: "0",
        padding: "0",
    };
}

export const TabsStyle  = (tabsStyle: BaseStyle, tabAlignment: TabAlignment) : CSSProperties => {
    let position;
    if(tabAlignment === TabAlignment.top || tabAlignment === TabAlignment.left){
        position = {
            top: "0",
            left: "0"
        };
    }else if(tabAlignment === TabAlignment.bottom){
        position = {
            bottom: "0",
            left: "0"
        };
    }else{
        position = {
            top: "0",
            right: "0"
        };
    }
    let {background} = tabsStyle ?? {};

    return {
        background,
        ...position,
        height: 'fit-content', 
        width: 'fit-content', 
        position: 'absolute'
    };
}

export const TabsPlacement = (tabAlignment: TabAlignment) => {
    let alignment: string = tabAlignment == TabAlignment.top || tabAlignment == TabAlignment.bottom ? "row" : "column";
    return {
        display: "flex",
        flexDirection: alignment
    } as CSSProperties
}

export const TabsWrapperStyle = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
} as CSSProperties;

export const TabsDivStyle = { 
    height: '100%', 
    width: '100%' 
} as CSSProperties;