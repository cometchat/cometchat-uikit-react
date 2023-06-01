import { CometChatTheme } from "uikit-resources-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { ReactionConfiguration } from "./ReactionConfiguration";
import { ReactionExtensionDecorator } from "./ReactionExtensionDecorator";

export class ReactionExtension implements ExtensionsDataSource {
    private configuration?: ReactionConfiguration = new ReactionConfiguration({});
    private theme?: CometChatTheme = new CometChatTheme({});

    constructor({configuration, theme}: {configuration?: ReactionConfiguration, theme?: CometChatTheme} = {configuration: new ReactionConfiguration({}), theme: new CometChatTheme({})}) {
        this.configuration = configuration;
        this.theme = theme;
    }

    enable(): void {
        ChatConfigurator.enable((dataSource) =>
            new ReactionExtensionDecorator(dataSource, {configuration: this.configuration as ReactionConfiguration, theme: this.theme as CometChatTheme})
        );
    }
}

