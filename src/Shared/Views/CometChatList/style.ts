import { LabelStyle, LoaderStyle, SearchInputStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { TitleAlignment } from "uikit-utils-lerna";
import { ListStyle } from "uikit-utils-lerna";

export function listWrapperStyle(listStyle : ListStyle | null) : CSSProperties {
    return {
        boxSizing: "border-box",
        width: listStyle?.width || "100%",
        height: listStyle?.height || "100%",
        border: listStyle?.border || "none",
        borderRadius: listStyle?.borderRadius || "0",
        background: listStyle?.background || "white",
        boxShadow: listStyle?.boxShadow,
        display: "flex",
        flexDirection: "column",
        rowGap: "16px",
        overflow: "hidden"
    };
}

export function headerStyle() : CSSProperties {
    return {
        flexShrink: "0",
        padding: "0 16px"
    };
}

export function titleStyle(listStyle : ListStyle | null, titleAlignment : TitleAlignment) : CSSProperties {
    return {
        textAlign: titleAlignment === TitleAlignment.left ? "left" : "center",
        font: listStyle?.titleTextFont || "700 22px Inter",
        color: listStyle?.titleTextColor || "rgb(20, 20, 20)",
        margin: "8px 0"
    };
}

export function searchInputStyle(listStyle : ListStyle | null) : SearchInputStyle {
    //   Property not set - boxShadow? : string;
    return {
        border: listStyle?.searchBorder || "none",
        borderRadius: listStyle?.searchBorderRadius || "8px",
        width: "100%",
        height: "auto",
        background: listStyle?.searchBackground || "rgb(20, 20, 20, 0.04)",
        searchTextFont: listStyle?.searchTextFont || "400 15px Inter",
        searchTextColor: listStyle?.searchTextColor || "rgb(20, 20, 20)",
        placeholderTextFont: listStyle?.searchPlaceholderTextFont || "400 15px Inter",
        placeholderTextColor: listStyle?.searchPlaceholderTextColor || "rgb(20, 20, 20, 0.46)",
        searchIconTint: listStyle?.searchIconTint || "rgb(20, 20, 20, 0.46)"
    };
}

export function listItemContainerStyle() : CSSProperties {
    return {
        overflowY: "auto",
        flexGrow: "1",
        padding: "0 16px",
        overflowX: "hidden"
    };
}

export function viewContainerStyle() : CSSProperties {
    return {
        height: "calc(100% - 1px)",
        overflow: "auto"
    };
}

export function defaultViewStyle() : CSSProperties {
    return {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
    };
}

export function customViewStyle() : CSSProperties {
    return {
        width: "100%",
        height: "100%"
    };
}

export function loaderStyle(listStyle : ListStyle | null) : LoaderStyle {
    return {
        iconTint: listStyle?.loadingIconTint || "rgb(20, 20, 20, 0.58)"
    };
}

export function sectionHeaderStyle(listStyle : ListStyle | null) : CSSProperties {
    return {
        font: listStyle?.sectionHeaderTextFont || "500 12px Inter",
        color: listStyle?.sectionHeaderTextColor || "rbg(20, 20, 20, 0.46)",
        margin: "8px 0"
    };
}

export function errorLabelStyle(listStyle : ListStyle | null) : LabelStyle {
    return {
        textFont: listStyle?.errorStateTextFont || "700 22px Inter",
        textColor: listStyle?.errorStateTextColor || "rgb(20, 20, 20, 0.33)"
    };
}

export function emptyLabelStyle(listStyle : ListStyle | null) : LabelStyle {
    return {
        textFont: listStyle?.emptyStateTextFont || "700 22px Inter",
        textColor: listStyle?.emptyStateTextColor || "rgb(20, 20, 20, 0.33)"
    };
}

export function intersectionObserverBottomTargetDivStyle() : CSSProperties {
    return {
        height: "1px"
    };
}
