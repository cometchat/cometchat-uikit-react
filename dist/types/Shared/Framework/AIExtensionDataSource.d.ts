declare abstract class AIExtensionDataSource {
    abstract addExtension(): void;
    abstract getExtensionId(): string;
    enable(): void;
}
export { AIExtensionDataSource };
