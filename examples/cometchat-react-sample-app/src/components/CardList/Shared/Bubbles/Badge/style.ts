import { CSSProperties } from "react";

export function inputStyle(themeMode: string) : CSSProperties {
    return {
    height: "21px",
    width: "93%",
    outline: "none",
    padding: "8px",
    borderRadius: "12px",
    background: "transparent",
    font: "400 13px Inter, sans-serif",
    borderColor: themeMode === "dark" ? "#bbb" :  "rgba(20, 20, 20, 0.08)",
    color: themeMode === "dark" ? "#bbb" : "rgba(20, 20, 20, 0.58)",
    border: "1px solid",
    marginTop:"15px"
    }
}
export const badgeDemoStyle:any = {
    flexDirection: "column",
    alignItems: "center",
    display: "flex",
    marginTop:"15px"
}
export const colorButtonStyle:any = {
    border: "none",
    padding:"10px",
    borderRight: "1px solid white",
    color: "#ffff",
    borderRadius: "5px",
    height: "30px",
    width: "30px",
    fontSize: "12px"
}