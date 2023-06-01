import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { ThumbnailGenerationExtensionDecorator } from "./ThumbnailGenerationExtensionDecorator";

export class ThumbnailGenerationExtension implements ExtensionsDataSource {
    enable(): void {
        ChatConfigurator.enable((dataSource) =>
            new ThumbnailGenerationExtensionDecorator(dataSource)
        );
    }
}

