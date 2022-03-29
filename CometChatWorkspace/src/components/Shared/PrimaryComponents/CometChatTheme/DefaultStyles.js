export const DefaultStyles = {
  "*": {
    boxSizing: "border-box",
    "::-webkit-scrollbar": {
      width: "8px",
      height: "4px",
    },
    "::-webkit-scrollbar-track": {
      background: "#ffffff00",
    },
    "::-webkit-scrollbar-thumb": {
      background: "#ccc",
      "&:hover": {
        background: "#aaa",
      },
    },
  },
};
