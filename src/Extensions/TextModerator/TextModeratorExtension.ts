import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { TextModeratorExtensionDecorator } from "./TextModeratorExtensionDecorator";

export class TextModeratorExtension implements ExtensionsDataSource {
    enable(): void {
        ChatConfigurator.enable(
            (dataSource) => new TextModeratorExtensionDecorator(dataSource)
        );
    }
}

