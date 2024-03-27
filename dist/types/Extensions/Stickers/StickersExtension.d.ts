import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { StickersConfiguration } from "./StickersConfiguration";
export declare class StickersExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: StickersConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
