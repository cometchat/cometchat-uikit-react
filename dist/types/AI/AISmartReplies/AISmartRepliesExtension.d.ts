import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
import { AISmartRepliesConfiguration } from "@cometchat/uikit-shared";
export declare class AISmartRepliesExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AISmartRepliesConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
