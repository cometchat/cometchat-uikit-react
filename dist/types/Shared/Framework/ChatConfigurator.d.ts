import { DataSource } from "./DataSource";
export declare class ChatConfigurator {
    static dataSource: DataSource;
    static names: Array<string>;
    static init(initialSource?: DataSource): void;
    static enable(callback: (dataSource: DataSource) => DataSource): void;
    static getDataSource(): DataSource;
}
