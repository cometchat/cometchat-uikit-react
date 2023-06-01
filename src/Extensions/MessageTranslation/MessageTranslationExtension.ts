import { MessageTranslationExtensionDecorator } from "./MessageTranslationExtensionDecorator";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { MessageTranslationConfiguration } from "./MessageTranslationConfiguration";

export class MessageTranslationExtension implements ExtensionsDataSource {
    private configuration?: MessageTranslationConfiguration = new MessageTranslationConfiguration({});

    constructor({configuration}: {configuration?: MessageTranslationConfiguration} = {configuration: new MessageTranslationConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable((dataSource) =>
            new MessageTranslationExtensionDecorator(dataSource, {configuration: (this.configuration as MessageTranslationConfiguration)})
        );
    }
}

