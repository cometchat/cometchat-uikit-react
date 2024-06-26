import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { ReactionConfiguration } from "./ReactionConfiguration";
export declare class ReactionExtension extends ExtensionsDataSource {
    private configuration?;
    private theme?;
    constructor(configuration?: ReactionConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
