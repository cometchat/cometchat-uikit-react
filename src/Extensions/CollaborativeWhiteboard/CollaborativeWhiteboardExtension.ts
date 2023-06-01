import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { CollaborativeWhiteboardConfiguration } from "./CollaborativeWhiteboardConfiguration";
import { CollaborativeWhiteBoardExtensionDecorator } from "./CollaborativeWhiteboardExtensionDecorator";

export class CollaborativeWhiteBoardExtension implements ExtensionsDataSource {
    configuration?: CollaborativeWhiteboardConfiguration = new CollaborativeWhiteboardConfiguration({});

    constructor({configuration}: {configuration?: CollaborativeWhiteboardConfiguration} = {configuration: new CollaborativeWhiteboardConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable(
            (dataSource) => {
                return new CollaborativeWhiteBoardExtensionDecorator(dataSource, {configuration: (this.configuration as CollaborativeWhiteboardConfiguration)})
            }
        );
    }
}
