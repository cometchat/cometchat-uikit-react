import { CSSProperties } from "react";
export function loadingComponentModalStyle(showModal : boolean) : CSSProperties {
    return {
        height: "100%",
        width: "100%",
        background: "#a1a1a1e6",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: showModal ? "flex" : "none",
        zIndex: 1
    };
}

export function componentDetailsModalStyle(themeMode: string) : CSSProperties {
    return {
        height: "auto",
        width: "100%",
        maxWidth: "300px",
        minHeight: "150px",
        transform: "translate(-50%, -50%)",
        left: "50%",
        top:"50%",
        position: "absolute",
        zIndex: "10",
        padding: "12px 16px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: themeMode === "dark" ? "black" : "white",
        color: themeMode === "dark" ? "white" : "black",
        boxShadow: "rgba(20, 20, 20, 0.33) 0px 0px 3px"
        }
};

export const componentDetailsModalHeaderStyle = {
    textAlign: "left" as "left",
    fontWeight: "700",
    fontSize: "15px",
    display: "flex",
    width: '100%',
    justifyContent: 'space-between',
    color: "inherit"
}

export const componentDetailsModalTitleStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}

export const componentDetailsModalCloseIconWrapperStyle = {
    height: "30px",
    width: "30px",
    cursor: "pointer",
}

export const componentDetailsModalDescriptionStyle  = {
    marginTop: "10px",
    textAlign: "left" as "left",
    fontWeight: "400",
    fontSize: "13px",
    color: "#777777",
    lineHeight:"17px"
}

 export const componentDetailModalCloseIconStyle = {
    width: "24px"
 }
 
 export const tabListStyle = {
    width: "24px"
 }