import { SmartReplyExtensionDecorator } from "./SmartRepliesExtensionDecorator";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { SmartRepliesConfiguration } from "./SmartRepliesConfiguration";
import { CometChatTheme } from "uikit-resources-lerna";

export class SmartReplyExtension implements ExtensionsDataSource {
    private configuration?: SmartRepliesConfiguration = new SmartRepliesConfiguration({});
    private theme?: CometChatTheme = new CometChatTheme({});

    constructor({configuration, theme}: {configuration?: SmartRepliesConfiguration, theme?: CometChatTheme} = {configuration: new SmartRepliesConfiguration({}), theme: new CometChatTheme({})}) {
        this.configuration = configuration;
        this.theme = theme;
    }

    enable(): void {
        ChatConfigurator.enable((dataSource) =>
            new SmartReplyExtensionDecorator(dataSource, {configuration: this.configuration as SmartRepliesConfiguration, theme: this.theme as CometChatTheme})
        );
    }
}