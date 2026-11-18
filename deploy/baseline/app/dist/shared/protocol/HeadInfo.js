"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadInfo = void 0;
class HeadInfo {
    _length = 0;
    _version = '1';
    _cmdID = 0;
    _userID = 0;
    _result = 0;
    _error = 0;
    get Length() { return this._length; }
    get Version() { return this._version; }
    get CmdID() { return this._cmdID; }
    get UserID() { return this._userID; }
    get Result() { return this._result; }
    get Error() { return this._error; }
    static HEAD_LENGTH_V1 = 17; // 版本1头部长度
    static HEAD_LENGTH_V2 = 21; // 版本2头部长度
    static GetHeadLength(version) {
        if (version === '1')
            return HeadInfo.HEAD_LENGTH_V1;
        if (version === '2')
            return HeadInfo.HEAD_LENGTH_V2;
        throw new Error('未知的协议版本');
    }
    static Parse(buffer, version = '1') {
        const headLength = HeadInfo.GetHeadLength(version);
        if (buffer.length < headLength)
            return null;
        const head = new HeadInfo();
        let offset = 0;
        head._length = buffer.readUInt32BE(offset);
        offset += 4;
        head._version = buffer.toString('utf8', offset, offset + 1);
        offset += 1;
        head._cmdID = buffer.readUInt32BE(offset);
        offset += 4;
        head._userID = buffer.readUInt32BE(offset);
        offset += 4;
        head._result = buffer.readInt32BE(offset);
        offset += 4;
        if (version === '2') {
            head._error = buffer.readUInt32BE(offset);
        }
        return head;
    }
}
exports.HeadInfo = HeadInfo;
//# sourceMappingURL=HeadInfo.js.map