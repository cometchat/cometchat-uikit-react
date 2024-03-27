import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { ImageModerationConfiguration } from "./ImageModerationConfiguration";
export declare class ImageModerationExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: ImageModerationConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
