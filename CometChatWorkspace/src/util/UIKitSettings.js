export class UIKitSettings {

    static widgetSettings;

    static setWidgetSettings = (widgetSettings) => {

        if (!this.widgetSettings) {
            this.widgetSettings = widgetSettings;
        }
    }

    static validateWidgetSettings = (section, checkAgainst) => {

        let output = null;

        if (this.widgetSettings && this.widgetSettings.hasOwnProperty(section)) {

            if (this.widgetSettings[section].hasOwnProperty(checkAgainst)) {
                output = this.widgetSettings[section][checkAgainst];
            } else {
                output = false;
            }
        }

        return output;
    }

    static getCallingCustomCSS = () => {

        let customCSS = this.validateWidgetSettings("style", "custom_css");

        //if custom css is added
        if (customCSS !== null && customCSS !== false && customCSS.trim().length) {
            return customCSS;
        }

        return null;
    }

    static getDocument = () => {

        let document = window.document;
        if (this.widgetSettings) {
            const parentnode = (this.widgetSettings.hasOwnProperty("parentNode")) ? this.widgetSettings.parentNode : null;
            if (parentnode) {
                document = parentnode.querySelector('iframe').contentWindow.document;
            }
        }

        return document;
    }
}