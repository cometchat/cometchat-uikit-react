export const pickerStyle = () => {

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ".emoji-mart": {
            borderRadius: "5px 5px 0 0",
            borderBottom: "0px",
            ".emoji-mart-category-list": {
                " > li": {
                    width: "50px",
                    height: "30px",
                    margin: "8px",
                    ".emoji-mart-emoji": {
                        width: "50px",
                        height: "30px",
                        padding: "0px",
                        " > span": {
                            width: "50px!important",
                            height: "30px!important",
                            cursor: "pointer",
                        }
                    }
                }
            },
        },
        ".emoji-mart-scroll": {
            height: "200px"
        },
        ".emoji-mart-preview, .emoji-mart-search": {
            display: "none"
        },
        ".emoji-mart-category": {
            ".emoji-mart-emoji:hover:before": {
                background: "none",
                borderRadius: "0px",
            }
        }
    }
}