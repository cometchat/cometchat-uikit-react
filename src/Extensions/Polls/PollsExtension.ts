import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { PollsConfiguration } from "./PollsConfiguration";
import { PollsExtensionDecorator } from "./PollsExtensionDecorator";

export class PollsExtension implements ExtensionsDataSource {
    private configuration?: PollsConfiguration = new PollsConfiguration({});

    constructor({configuration}: {configuration?: PollsConfiguration} = {configuration: new PollsConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable((dataSource) => new PollsExtensionDecorator(dataSource, {configuration: (this.configuration as PollsConfiguration)}));
    }
}