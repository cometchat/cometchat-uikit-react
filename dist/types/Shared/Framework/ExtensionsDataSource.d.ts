declare abstract class ExtensionsDataSource {
    abstract addExtension(): void;
    abstract getExtensionId(): string;
    enable(): void;
}
export { ExtensionsDataSource };
