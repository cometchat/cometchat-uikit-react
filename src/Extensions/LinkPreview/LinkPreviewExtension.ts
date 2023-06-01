import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { LinkPreviewConfiguration } from "./LinkPreviewConfiguration";
import { LinkPreviewExtensionDecorator } from "./LinkPreviewExtensionDecorator";

export class LinkPreviewExtension implements ExtensionsDataSource {
    private configuration?: LinkPreviewConfiguration = new LinkPreviewConfiguration({});

    constructor({configuration}: {configuration?: LinkPreviewConfiguration} = {configuration: new LinkPreviewConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable((dataSource) =>
            new LinkPreviewExtensionDecorator(dataSource, {configuration: (this.configuration as LinkPreviewConfiguration)})
        );
    }
}

