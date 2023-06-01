import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionsDataSource";
import { StickersConfiguration } from "./StickersConfiguration";
import { StickersExtensionDecorator } from './StickersExtensionDecorator';

export class StickersExtension implements ExtensionsDataSource {
    private configuration?: StickersConfiguration = new StickersConfiguration({});

    constructor({configuration}: {configuration?: StickersConfiguration} = {configuration: new StickersConfiguration({})}) {
        this.configuration = configuration;
    }

    enable(): void {
        ChatConfigurator.enable(
            (dataSource) => {
                return new StickersExtensionDecorator(dataSource, {configuration: (this.configuration as StickersConfiguration)})
            }
        );
    }
}
