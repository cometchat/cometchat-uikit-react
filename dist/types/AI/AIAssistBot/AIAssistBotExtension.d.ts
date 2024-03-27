import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
import { AIAssistBotConfiguration } from "@cometchat/uikit-shared";
export declare class AIAssistBotExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AIAssistBotConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
