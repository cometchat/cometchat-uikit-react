import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { CollaborativeDocumentConfiguration } from "./CollaborativeDocumentConfiguration";
import { CollaborativeDocumentExtensionDecorator } from "./CollaborativeDocumentExtensionDecorator";

export class CollaborativeDocumentExtension implements ExtensionsDataSource {
    private configuration?: CollaborativeDocumentConfiguration = new CollaborativeDocumentConfiguration({});

    constructor({configuration}: {configuration?: CollaborativeDocumentConfiguration} = {configuration: new CollaborativeDocumentConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable(
            (dataSource) => {
                return new CollaborativeDocumentExtensionDecorator(dataSource, {configuration: (this.configuration as CollaborativeDocumentConfiguration)})
            }
        );
    }

}