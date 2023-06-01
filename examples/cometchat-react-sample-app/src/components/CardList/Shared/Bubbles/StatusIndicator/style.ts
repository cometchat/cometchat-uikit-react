import { CSSProperties } from "react";

export function statusIndicatorStyle() : CSSProperties {
    return {
        height:"18px", 
        width:"18px",
        borderRadius:"50%",
        border: "none"
    };
}
export function statusIndicatorWrapperStyle() : CSSProperties {
    return {
        display: "flex",justifyContent: "center",alignItems: "center",position: "relative",margin: "0 auto",height:"30px"
    };
}

