import { Palette } from "./Palette";
import { Typography } from "./Typography";
import { Breakpoints } from "./Breakpoints";
import { DefaultStyles } from "./DefaultStyles";
import { withCometChatTheme } from "./withCometChatTheme";

class CometChatTheme {
  constructor() {
    return {
      palette: new Palette(),
      typography: new Typography(),
      globalStyles: { ...DefaultStyles },
      breakpoints: new Breakpoints(),
    };
  }
}

export { CometChatTheme, Palette, Typography, Breakpoints, withCometChatTheme };
