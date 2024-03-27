import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { MessageTranslationConfiguration } from "./MessageTranslationConfiguration";
export declare class MessageTranslationExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: MessageTranslationConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
