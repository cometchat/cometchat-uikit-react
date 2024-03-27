import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { CollaborativeDocumentConfiguration } from "./CollaborativeDocumentConfiguration";
export declare class CollaborativeDocumentExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: CollaborativeDocumentConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
