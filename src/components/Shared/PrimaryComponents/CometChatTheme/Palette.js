const modes = {
  light: "light",
  dark: "dark",
};

const opacity = {
  accent50: {
    [modes.light]: 0.04,
    [modes.dark]: 0.04,
  },
  accent100: {
    [modes.light]: 0.08,
    [modes.dark]: 0.08,
  },
  accent200: {
    [modes.light]: 0.15,
    [modes.dark]: 0.14,
  },
  accent300: {
    [modes.light]: 0.24,
    [modes.dark]: 0.23,
  },
  accent400: {
    [modes.light]: 0.33,
    [modes.dark]: 0.34,
  },
  accent500: {
    [modes.light]: 0.46,
    [modes.dark]: 0.46,
  },
  accent600: {
    [modes.light]: 0.58,
    [modes.dark]: 0.58,
  },
  accent700: {
    [modes.light]: 0.69,
    [modes.dark]: 0.71,
  },
  accent800: {
    [modes.light]: 0.82,
    [modes.dark]: 0.84,
  },
};

const getAccentOpacity = (colorCode, opacity) => {
  if (colorCode.startsWith("#")) {
    return hexToRGBA(colorCode, opacity);
  }

  return RGBToRGBA(colorCode, opacity);
};

const hexToRGBA = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return "rgba(" + +r + "," + +g + "," + +b + "," + opacity + ")";
};

const RGBToRGBA = (rgb, opacity) => {
  // Choose correct separator
  let sep = rgb.indexOf(",") > -1 ? "," : " ";
  // Turn "rgb(r,g,b)" into [r,g,b]
  rgb = rgb.substr(4).split(")")[0].split(sep);

  let r = (+rgb[0]).toString(16),
    g = (+rgb[1]).toString(16),
    b = (+rgb[2]).toString(16);

  return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
};

/**
 * @class PaletteItem
 * @param {String} light
 * @param {String} dark
 */
class PaletteItem {
  constructor({ light = "", dark = "" }) {
    this.light = light;
    this.dark = dark;
  }
}

/**
 * @class Palette
 * @param {String} mode
 * @param {Object} background
 * @param {Object} primary
 * @param {Object} secondary
 * @param {Object} error
 * @param {Object} success
 * @param {Object} accent
 * @param {Object} accent50
 * @param {Object} accent100
 * @param {Object} accent200
 * @param {Object} accent300
 * @param {Object} accent400
 * @param {Object} accent500
 * @param {Object} accent600
 * @param {Object} accent700
 * @param {Object} accent800
 * @param {Object} accent900
 */

class Palette {
  constructor({
    mode = modes.light,
    background = new PaletteItem({
      [modes.light]: "rgb(255,255,255)",
      [modes.dark]: "rgb(0,0,0)",
    }),
    primary = new PaletteItem({
      [modes.light]: "rgb(51, 153, 255)",
      [modes.dark]: "rgb(51, 153, 255)",
    }),
    secondary = new PaletteItem({
      [modes.light]: "rgba(248, 248, 248, 0.92)",
      [modes.dark]: "rgba(248, 248, 248, 0.92)",
    }),
    error = new PaletteItem({
      [modes.light]: "rgb(255, 59, 48)",
      [modes.dark]: "rgb(255, 59, 48)",
    }),
    success = new PaletteItem({
      [modes.light]: "rgb(0, 200, 111)",
      [modes.dark]: "rgb(0, 200, 111)",
    }),
    accent = new PaletteItem({
      [modes.light]: "rgb(20, 20, 20)",
      [modes.dark]: "rgb(255, 255, 255)",
    }),
    accent50 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.04)",
      [modes.dark]: "rgba(255, 255, 255, 0.04)",
    }),
    accent100 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.08)",
      [modes.dark]: "rgba(255, 255, 255, 0.08)",
    }),
    accent200 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.15)",
      [modes.dark]: "rgba(255, 255, 255, 0.14)",
    }),
    accent300 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.24)",
      [modes.dark]: "rgba(255, 255, 255, 0.23)",
    }),
    accent400 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.33)",
      [modes.dark]: "rgba(255, 255, 255, 0.34)",
    }),
    accent500 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.46)",
      [modes.dark]: "rgba(255, 255, 255, 0.46)",
    }),
    accent600 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.58)",
      [modes.dark]: "rgba(255, 255, 255, 0.58)",
    }),
    accent700 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.69)",
      [modes.dark]: "rgba(255, 255, 255, 0.71)",
    }),
    accent800 = new PaletteItem({
      [modes.light]: "rgba(20, 20, 20, 0.82)",
      [modes.dark]: "rgba(255, 255, 255, 0.84)",
    }),
    accent900 = new PaletteItem({
      [modes.light]: "rgb(255, 255, 255)",
      [modes.dark]: "rgb(20, 20, 20)",
    }),
  }) {
    this.mode = mode;
    this.background = background;
    this.primary = primary;
    this.secondary = secondary;
    this.error = error;
    this.success = success;
    this.accent = accent;
    this.accent50 = accent50;
    this.accent100 = accent100;
    this.accent200 = accent200;
    this.accent300 = accent300;
    this.accent400 = accent400;
    this.accent500 = accent500;
    this.accent600 = accent600;
    this.accent700 = accent700;
    this.accent800 = accent800;
    this.accent900 = accent900;
  }

  /**
   * Getters
   */
  getAccent = () => {
    return this.accent[this.mode];
  };
  getAccent50 = () => {
    return this.accent50[this.mode];
  };
  getAccent100 = () => {
    return this.accent100[this.mode];
  };
  getAccent200 = () => {
    return this.accent200[this.mode];
  };
  getAccent300 = () => {
    return this.accent300[this.mode];
  };
  getAccent400 = () => {
    return this.accent400[this.mode];
  };
  getAccent500 = () => {
    return this.accent500[this.mode];
  };
  getAccent600 = () => {
    return this.accent600[this.mode];
  };
  getAccent700 = () => {
    return this.accent700[this.mode];
  };
  getAccent800 = () => {
    return this.accent800[this.mode];
  };
  getAccent900 = () => {
    return this.accent900[this.mode];
  };
  getSuccess = () => {
    return this.success[this.mode];
  };
  getError = () => {
    return this.error[this.mode];
  };
  getPrimary = () => {
    return this.primary[this.mode];
  };
  getSecondary = () => {
    return this.secondary[this.mode];
  };
  getBackground = () => {
    return this.background[this.mode];
  };

  /**
   * Setters
   */
  setMode(mode) {
    this.mode = mode;
  }

  setBackground(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.background = colorset;
    }
  }

  setPrimary(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.primary = colorset;
    }
  }

  setError(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.error = colorset;
    }
  }

  setAccent(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };

      this.setAccent900({
        [modes.light]: colorset[modes.dark],
        [modes.dark]: colorset[modes.light],
      });

      this.setAccent50({
        [modes.light]: getAccentOpacity(
          colorset[modes.light],
          opacity.accent50[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset[modes.light],
          opacity.accent50[modes.dark]
        ),
      });

      this.setAccent100({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent100[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent100[modes.dark]
        ),
      });

      this.setAccent200({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent200[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent200[modes.dark]
        ),
      });

      this.setAccent300({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent300[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent300[modes.dark]
        ),
      });

      this.setAccent400({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent400[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent400[modes.dark]
        ),
      });

      this.setAccent500({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent500[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent500[modes.dark]
        ),
      });

      this.setAccent600({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent600[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent600[modes.dark]
        ),
      });

      this.setAccent700({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent700[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent700[modes.dark]
        ),
      });

      this.setAccent800({
        [modes.light]: getAccentOpacity(
          colorset.light,
          opacity.accent800[modes.light]
        ),
        [modes.dark]: getAccentOpacity(
          colorset.dark,
          opacity.accent800[modes.dark]
        ),
      });
    }
  }

  setAccent50(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent50 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent100(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent100 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent200(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent200 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent300(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent300 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent400(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent400 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent500(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent500 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent600(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent600 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent700(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent700 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent800(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent800 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }

  setAccent900(colorset) {
    if (colorset && colorset[modes.light] && colorset[modes.dark]) {
      this.accent900 = {
        [modes.light]: colorset[modes.light],
        [modes.dark]: colorset[modes.dark],
      };
    }
  }
}

export { modes, Palette };
