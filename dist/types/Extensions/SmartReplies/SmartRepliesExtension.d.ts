import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { SmartRepliesConfiguration } from "./SmartRepliesConfiguration";
export declare class SmartReplyExtension extends ExtensionsDataSource {
    private configuration?;
    private theme?;
    constructor(configuration?: SmartRepliesConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
