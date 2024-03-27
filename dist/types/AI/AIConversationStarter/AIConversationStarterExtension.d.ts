import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
import { AIConversationStarterConfiguration } from "@cometchat/uikit-shared";
export declare class AIConversationStarterExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AIConversationStarterConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
