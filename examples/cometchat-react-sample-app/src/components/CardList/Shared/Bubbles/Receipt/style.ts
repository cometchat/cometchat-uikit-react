
import { CSSProperties } from "react";
export function componentDetailsModalStyle(themeMode: string) : CSSProperties {
    return {
        height: "auto",
        width: "100%",
        maxWidth: "600px",
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
