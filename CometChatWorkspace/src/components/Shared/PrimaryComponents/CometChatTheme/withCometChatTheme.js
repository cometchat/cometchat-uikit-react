import React from "react";

import { Palette } from "./Palette";
import { Typography } from "./Typography";
import { Breakpoints } from "./Breakpoints";
import { DefaultStyles } from "./DefaultStyles";

export const withCometChatTheme = (WrappedComponent, theme) => {

	// Build a wrapper and return
	return props => {

		const [defaultTheme, setDefaultTheme] = React.useState(null);

		React.useEffect(() => {

			let palette = new Palette(),
				typography = new Typography(),
				globalStyles = { ...DefaultStyles },
				breakpoints = new Breakpoints();


			if (theme && theme.palette) {

				if (theme.palette.hasOwnProperty("mode")) {
					palette.setMode(theme.palette.mode);
				}

				if (theme.palette.hasOwnProperty("background")) {
					palette.setBackground(theme.palette.background);
				}

				if (theme.palette.hasOwnProperty("primary")) {
					palette.setPrimary(theme.palette.primary);
				}

				if (theme.palette.hasOwnProperty("error")) {
					palette.setError(theme.palette.error);
				}

				if (theme.palette.hasOwnProperty("accent")) {
					palette.setAccent(theme.palette.accent);
				}

				if (theme.palette.hasOwnProperty("accent50")) {
					palette.setAccent50(theme.palette.accent50);
				}

				if (theme.palette.hasOwnProperty("accent100")) {
					palette.setAccent100(theme.palette.accent100);
				}

				if (theme.palette.hasOwnProperty("accent200")) {
					palette.setAccent200(theme.palette.accent200);
				}

				if (theme.palette.hasOwnProperty("accent300")) {
					palette.setAccent300(theme.palette.accent300);
				}

				if (theme.palette.hasOwnProperty("accent400")) {
					palette.setAccent400(theme.palette.accent400);
				}

				if (theme.palette.hasOwnProperty("accent500")) {
					palette.setAccent500(theme.palette.accent500);
				}

				if (theme.palette.hasOwnProperty("accent600")) {
					palette.setAccent600(theme.palette.accent600);
				}

				if (theme.palette.hasOwnProperty("accent700")) {
					palette.setAccent700(theme.palette.accent700);
				}

				if (theme.palette.hasOwnProperty("accent800")) {
					palette.setAccent800(theme.palette.accent800);
				}
			} 

			if (theme && theme.typography) {

				if (theme.typography.hasOwnProperty("fontFamily")) {
					typography.setFontFamily(theme.typography.fontFamily);
				}
				
				if (theme.typography.hasOwnProperty("fontWeightRegular")) {
					typography.setFontWeightRegular(theme.typography.fontWeightRegular);
				}

				if (theme.typography.hasOwnProperty("fontWeightMedium")) {
					typography.setFontWeightMedium(theme.typography.fontWeightMedium);
				}

				if (theme.typography.hasOwnProperty("fontWeightSemibold")) {
					typography.setFontWeightSemibold(theme.typography.fontWeightSemibold);
				}

				if (theme.typography.hasOwnProperty("fontWeightBold")) {
					typography.setFontWeightBold(theme.typography.fontWeightBold);
				}

				if (theme.typography.hasOwnProperty("heading")) {
					typography.setHeading(theme.typography.heading);
				}

				if (theme.typography.hasOwnProperty("name")) {
					typography.setName(theme.typography.name);
				}

				if (theme.typography.hasOwnProperty("title1")) {
					typography.setTitle1(theme.typography.title1);
				}

				if (theme.typography.hasOwnProperty("title2")) {
					typography.setTitle2(theme.typography.title2);
				}

				if (theme.typography.hasOwnProperty("subtitle1")) {
					typography.setSubtitle1(theme.typography.subtitle1);
				}

				if (theme.typography.hasOwnProperty("subtitle2")) {
					typography.setSubtitle2(theme.typography.subtitle2);
				}

				if (theme.typography.hasOwnProperty("text1")) {
					typography.setText1(theme.typography.text1);
				}

				if (theme.typography.hasOwnProperty("text2")) {
					typography.setText2(theme.typography.text2);
				}

				if (theme.typography.hasOwnProperty("caption1")) {
					typography.setCaption1(theme.typography.caption1);
				}

				if (theme.typography.hasOwnProperty("caption2")) {
					typography.setCaption2(theme.typography.caption2);
				}
			}

			if (theme && theme.globalStyles && Object.keys(theme.globalStyles).length) {
				globalStyles = { ...theme.globalStyles };
			}

			if (theme && theme.breakpoints && theme.breakpoints.values && Object.keys(theme.breakpoints.values).length) {
				breakpoints = new Breakpoints();
				breakpoints.setValues({ ...theme.breakpoints.values });
			}

			setDefaultTheme({
				palette: palette,
				typography: typography,
				globalStyles: globalStyles,
				breakpoints: breakpoints,
			});

		}, [theme]);

		return <WrappedComponent theme={defaultTheme} {...props} />;
	};
};
