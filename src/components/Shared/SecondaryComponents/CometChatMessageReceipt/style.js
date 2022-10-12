export const iconStyle = (props, img) => {
    return {
        background: `url(${img}) center center no-repeat`,
        display: "inline-block",
        width: "24px",
        height: "24px",
        ...props?.style
    };
}