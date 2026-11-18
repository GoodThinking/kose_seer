export interface IHeadInfo {
    Length: number;
    Version: string;
    CmdID: number;
    UserID: number;
    Result: number;
    Error?: number;
}
export declare class HeadInfo {
    private _length;
    private _version;
    private _cmdID;
    private _userID;
    private _result;
    private _error;
    get Length(): number;
    get Version(): string;
    get CmdID(): number;
    get UserID(): number;
    get Result(): number;
    get Error(): number;
    static readonly HEAD_LENGTH_V1 = 17;
    static readonly HEAD_LENGTH_V2 = 21;
    static GetHeadLength(version: string): number;
    static Parse(buffer: Buffer, version?: string): HeadInfo | null;
}
//# sourceMappingURL=HeadInfo.d.ts.map