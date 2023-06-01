import { MessagesDataSource } from "../Utils/MessagesDataSource";
import { DataSource } from "./DataSource";

export class ChatConfigurator{
    static dataSource: DataSource;
    static names: Array<string> = ["message utils"];

    static init(initialSource?: DataSource) {
        this.dataSource = initialSource ?? new MessagesDataSource();
        this.names.push(this.dataSource.getId());
    }

    static enable(callback: (dataSource: DataSource) => DataSource) {
        let oldSource: DataSource = this.dataSource;
        let newSource: DataSource = callback(oldSource);

        if (!this.names.find(nm => nm == newSource.getId())) {
            this.dataSource = newSource;
            this.names.push(this.dataSource.getId());
        }
    }

    static getDataSource(): DataSource {
        return this.dataSource;
    }
}
