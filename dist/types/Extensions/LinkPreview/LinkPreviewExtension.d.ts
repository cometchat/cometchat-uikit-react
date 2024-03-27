import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { LinkPreviewConfiguration } from "./LinkPreviewConfiguration";
export declare class LinkPreviewExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: LinkPreviewConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
