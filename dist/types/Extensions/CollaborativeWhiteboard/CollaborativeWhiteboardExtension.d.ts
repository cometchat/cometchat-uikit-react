import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { CollaborativeWhiteboardConfiguration } from "./CollaborativeWhiteboardConfiguration";
export declare class CollaborativeWhiteboardExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: CollaborativeWhiteboardConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
