import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { PollsConfiguration } from "./PollsConfiguration";
export declare class PollsExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: PollsConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}
