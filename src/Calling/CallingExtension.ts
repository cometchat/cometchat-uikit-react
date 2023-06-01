import { DataSource } from '../Shared/Framework/DataSource';
import { CallingExtensionDecorator } from './CallingExtensionDecorator';
import { ChatConfigurator } from '../Shared/Framework/ChatConfigurator';
import { ExtensionsDataSource } from '../Shared/Framework/ExtensionsDataSource';

export class CallingExtension implements ExtensionsDataSource {
    enable(): void {
        ChatConfigurator.enable((dataSource: DataSource) =>
            new CallingExtensionDecorator(dataSource)
        );
    }
}
