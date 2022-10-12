import React from "react";
import { localize } from "../..";

export const Hooks = (text, setMessageText) => {
  React.useEffect(() => {
    setMessageText(text);
  }, [text]);
};
