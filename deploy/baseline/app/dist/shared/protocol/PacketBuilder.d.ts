export declare class PacketBuilder {
    private _version;
    private _headLength;
    constructor(version?: string);
    Build(cmdID: number, userID: number, result: number, data?: Buffer): Buffer;
}
//# sourceMappingURL=PacketBuilder.d.ts.map