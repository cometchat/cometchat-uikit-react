import { CSSProperties } from "react";
export const avatarWrapperStyle:any = {
    flexDirection: "column",
    alignItems: "center",
    display: "flex",
    marginTop:"15px"
}

export function inputStyle(themeMode: string) : CSSProperties {
    return {
        height: "21px",
        width: "93%",
        outline: "none",
        padding: "8px",
        borderRadius: "12px",
        background: "transparent",
        font: "400 13px Inter, sans-serif",
        border: "1px solid",
        marginTop:"15px",
        borderColor: themeMode === "dark" ? "#bbb" :  "rgba(20, 20, 20, 0.08)",
        color: themeMode === "dark" ? "#bbb" : "rgba(20, 20, 20, 0.58)",
    }
}
