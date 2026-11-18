"use strict";
/**
 * AMF3 解码器 - 解析 Flash ByteArray.writeObject() 序列化的数据
 *
 * AMF (Action Message Format) 是 Adobe Flash 使用的二进制序列化格式
 * AMF3 是较新的版本，更紧凑高效
 *
 * 参考: https://en.wikipedia.org/wiki/Action_Message_Format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMFDecoder = exports.AMF3Type = void 0;
exports.DecodeAMF = DecodeAMF;
exports.FormatAMFValue = FormatAMFValue;
/**
 * AMF3 类型标记
 */
var AMF3Type;
(function (AMF3Type) {
    AMF3Type[AMF3Type["UNDEFINED"] = 0] = "UNDEFINED";
    AMF3Type[AMF3Type["NULL"] = 1] = "NULL";
    AMF3Type[AMF3Type["FALSE"] = 2] = "FALSE";
    AMF3Type[AMF3Type["TRUE"] = 3] = "TRUE";
    AMF3Type[AMF3Type["INTEGER"] = 4] = "INTEGER";
    AMF3Type[AMF3Type["DOUBLE"] = 5] = "DOUBLE";
    AMF3Type[AMF3Type["STRING"] = 6] = "STRING";
    AMF3Type[AMF3Type["XML_DOC"] = 7] = "XML_DOC";
    AMF3Type[AMF3Type["DATE"] = 8] = "DATE";
    AMF3Type[AMF3Type["ARRAY"] = 9] = "ARRAY";
    AMF3Type[AMF3Type["OBJECT"] = 10] = "OBJECT";
    AMF3Type[AMF3Type["XML"] = 11] = "XML";
    AMF3Type[AMF3Type["BYTE_ARRAY"] = 12] = "BYTE_ARRAY";
    AMF3Type[AMF3Type["VECTOR_INT"] = 13] = "VECTOR_INT";
    AMF3Type[AMF3Type["VECTOR_UINT"] = 14] = "VECTOR_UINT";
    AMF3Type[AMF3Type["VECTOR_DOUBLE"] = 15] = "VECTOR_DOUBLE";
    AMF3Type[AMF3Type["VECTOR_OBJECT"] = 16] = "VECTOR_OBJECT";
    AMF3Type[AMF3Type["DICTIONARY"] = 17] = "DICTIONARY";
})(AMF3Type || (exports.AMF3Type = AMF3Type = {}));
/**
 * AMF3 解码器
 */
class AMFDecoder {
    _buffer;
    _offset = 0;
    _stringRefs = [];
    _objectRefs = [];
    _traitRefs = [];
    constructor(buffer) {
        this._buffer = buffer;
    }
    /**
     * 解码 AMF3 数据
     */
    Decode() {
        if (this._offset >= this._buffer.length) {
            return undefined;
        }
        try {
            return this.ReadValue();
        }
        catch (e) {
            // 如果解码失败，返回错误信息和已读取的偏移量
            const err = e instanceof Error ? e : new Error(String(e));
            throw new Error(`AMF decode failed at offset ${this._offset}/${this._buffer.length}: ${err.message}`);
        }
    }
    /**
     * 获取当前偏移量
     */
    get Offset() {
        return this._offset;
    }
    /**
     * 读取一个值
     */
    ReadValue() {
        const type = this.ReadUInt8();
        switch (type) {
            case AMF3Type.UNDEFINED:
                return undefined;
            case AMF3Type.NULL:
                return null;
            case AMF3Type.FALSE:
                return false;
            case AMF3Type.TRUE:
                return true;
            case AMF3Type.INTEGER:
                return this.ReadU29();
            case AMF3Type.DOUBLE:
                return this.ReadDouble();
            case AMF3Type.STRING:
                return this.ReadString();
            case AMF3Type.XML_DOC:
            case AMF3Type.XML:
                return this.ReadXML();
            case AMF3Type.DATE:
                return this.ReadDate();
            case AMF3Type.ARRAY:
                return this.ReadArray();
            case AMF3Type.OBJECT:
                return this.ReadObject();
            case AMF3Type.BYTE_ARRAY:
                return this.ReadByteArray();
            case AMF3Type.VECTOR_INT:
                return this.ReadVectorInt();
            case AMF3Type.VECTOR_UINT:
                return this.ReadVectorUInt();
            case AMF3Type.VECTOR_DOUBLE:
                return this.ReadVectorDouble();
            case AMF3Type.VECTOR_OBJECT:
                return this.ReadVectorObject();
            case AMF3Type.DICTIONARY:
                return this.ReadDictionary();
            default:
                throw new Error(`Unknown AMF3 type: 0x${type.toString(16)} at offset ${this._offset - 1}`);
        }
    }
    // ============================================================
    // 基础类型读取
    // ============================================================
    ReadUInt8() {
        if (this._offset >= this._buffer.length) {
            throw new Error(`ReadUInt8: offset ${this._offset} >= buffer length ${this._buffer.length}`);
        }
        const value = this._buffer.readUInt8(this._offset);
        this._offset += 1;
        return value;
    }
    ReadDouble() {
        if (this._offset + 8 > this._buffer.length) {
            throw new Error(`ReadDouble: need 8 bytes at offset ${this._offset}, but only ${this._buffer.length - this._offset} bytes available`);
        }
        const value = this._buffer.readDoubleBE(this._offset);
        this._offset += 8;
        return value;
    }
    /**
     * 读取 U29 变长整数
     * AMF3 使用变长编码，每字节最高位表示是否还有后续字节
     */
    ReadU29() {
        let result = 0;
        let byte;
        // 最多读取4字节
        for (let i = 0; i < 4; i++) {
            byte = this.ReadUInt8();
            if (i < 3) {
                // 前3字节：取低7位
                result = (result << 7) | (byte & 0x7f);
                if ((byte & 0x80) === 0) {
                    return result;
                }
            }
            else {
                // 第4字节：取全部8位
                result = (result << 8) | byte;
            }
        }
        // 处理符号位 (29位有符号整数)
        if (result >= 0x10000000) {
            result -= 0x20000000;
        }
        return result;
    }
    // ============================================================
    // 字符串读取
    // ============================================================
    ReadString() {
        const ref = this.ReadU29();
        // 最低位为0表示引用
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._stringRefs[index] ?? '';
        }
        // 最低位为1表示内联字符串
        const length = ref >> 1;
        if (length === 0) {
            return '';
        }
        const str = this._buffer.toString('utf8', this._offset, this._offset + length);
        this._offset += length;
        // 非空字符串加入引用表
        this._stringRefs.push(str);
        return str;
    }
    // ============================================================
    // 复杂类型读取
    // ============================================================
    ReadDate() {
        const ref = this.ReadU29();
        // 引用
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        // 内联
        const timestamp = this.ReadDouble();
        const date = new Date(timestamp);
        this._objectRefs.push(date);
        return date;
    }
    ReadArray() {
        const ref = this.ReadU29();
        // 引用
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const denseCount = ref >> 1;
        const result = {};
        // 先添加到引用表（处理循环引用）
        this._objectRefs.push(result);
        // 读取关联部分 (key-value pairs)
        let key = this.ReadString();
        while (key !== '') {
            result[key] = this.ReadValue();
            key = this.ReadString();
        }
        // 读取密集部分 (indexed array)
        const denseArray = [];
        for (let i = 0; i < denseCount; i++) {
            denseArray.push(this.ReadValue());
        }
        // 如果只有密集部分，返回数组
        if (Object.keys(result).length === 0) {
            // 替换引用表中的对象
            this._objectRefs[this._objectRefs.length - 1] = denseArray;
            return denseArray;
        }
        // 混合数组：将密集部分合并到对象中
        for (let i = 0; i < denseArray.length; i++) {
            result[i] = denseArray[i];
        }
        return result;
    }
    ReadObject() {
        const ref = this.ReadU29();
        // 引用
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        // 读取 trait
        const trait = this.ReadTrait(ref);
        const obj = {};
        // 先添加到引用表
        this._objectRefs.push(obj);
        // 如果有类名，添加到对象
        if (trait.className) {
            obj['__class__'] = trait.className;
        }
        // 读取静态属性
        for (const propName of trait.properties) {
            obj[propName] = this.ReadValue();
        }
        // 读取动态属性
        if (trait.dynamic) {
            let key = this.ReadString();
            while (key !== '') {
                obj[key] = this.ReadValue();
                key = this.ReadString();
            }
        }
        return obj;
    }
    ReadTrait(ref) {
        // trait 引用
        if ((ref & 3) === 1) {
            const index = ref >> 2;
            return this._traitRefs[index];
        }
        // 内联 trait
        const trait = {
            className: '',
            dynamic: false,
            externalizable: false,
            properties: [],
        };
        trait.externalizable = (ref & 4) !== 0;
        trait.dynamic = (ref & 8) !== 0;
        const propCount = ref >> 4;
        trait.className = this.ReadString();
        // 读取属性名
        for (let i = 0; i < propCount; i++) {
            trait.properties.push(this.ReadString());
        }
        this._traitRefs.push(trait);
        return trait;
    }
    ReadXML() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const length = ref >> 1;
        const xml = this._buffer.toString('utf8', this._offset, this._offset + length);
        this._offset += length;
        this._objectRefs.push(xml);
        return xml;
    }
    ReadByteArray() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const length = ref >> 1;
        const data = this._buffer.subarray(this._offset, this._offset + length);
        this._offset += length;
        this._objectRefs.push(data);
        return data;
    }
    // ============================================================
    // Vector 类型读取
    // ============================================================
    ReadVectorInt() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const count = ref >> 1;
        this.ReadUInt8(); // fixed flag
        const result = [];
        this._objectRefs.push(result);
        for (let i = 0; i < count; i++) {
            result.push(this._buffer.readInt32BE(this._offset));
            this._offset += 4;
        }
        return result;
    }
    ReadVectorUInt() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const count = ref >> 1;
        this.ReadUInt8(); // fixed flag
        const result = [];
        this._objectRefs.push(result);
        for (let i = 0; i < count; i++) {
            result.push(this._buffer.readUInt32BE(this._offset));
            this._offset += 4;
        }
        return result;
    }
    ReadVectorDouble() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const count = ref >> 1;
        this.ReadUInt8(); // fixed flag
        const result = [];
        this._objectRefs.push(result);
        for (let i = 0; i < count; i++) {
            result.push(this.ReadDouble());
        }
        return result;
    }
    ReadVectorObject() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const count = ref >> 1;
        this.ReadUInt8(); // fixed flag
        this.ReadString(); // type name
        const result = [];
        this._objectRefs.push(result);
        for (let i = 0; i < count; i++) {
            result.push(this.ReadValue());
        }
        return result;
    }
    ReadDictionary() {
        const ref = this.ReadU29();
        if ((ref & 1) === 0) {
            const index = ref >> 1;
            return this._objectRefs[index];
        }
        const count = ref >> 1;
        this.ReadUInt8(); // weak keys flag
        const result = new Map();
        this._objectRefs.push(result);
        for (let i = 0; i < count; i++) {
            const key = this.ReadValue();
            const value = this.ReadValue();
            result.set(key, value);
        }
        return result;
    }
}
exports.AMFDecoder = AMFDecoder;
/**
 * 解码 AMF3 数据的便捷函数
 */
function DecodeAMF(buffer) {
    const decoder = new AMFDecoder(buffer);
    return decoder.Decode();
}
/**
 * 格式化 AMF 解码结果为可读字符串
 */
function FormatAMFValue(value, indent = 0) {
    const prefix = '  '.repeat(indent);
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'boolean')
        return String(value);
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'string')
        return `"${value}"`;
    if (value instanceof Date)
        return `Date(${value.toISOString()})`;
    if (value instanceof Buffer)
        return `ByteArray(${value.length} bytes)`;
    if (value instanceof Map) {
        const entries = Array.from(value.entries());
        if (entries.length === 0)
            return 'Map{}';
        const items = entries.map(([k, v]) => `${prefix}  ${FormatAMFValue(k)}: ${FormatAMFValue(v, indent + 1)}`);
        return `Map{\n${items.join(',\n')}\n${prefix}}`;
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            return '[]';
        // 检查是否是Point对象数组
        const isPointArray = value.length > 0 && value.every((v) => typeof v === 'object' && v !== null && 'x' in v && 'y' in v);
        if (isPointArray) {
            // Point数组用紧凑格式显示
            const points = value.map((v) => {
                const obj = v;
                return `Point(${obj.x}, ${obj.y})`;
            });
            return `[${points.join(', ')}]`;
        }
        // 简单数字数组用紧凑格式
        if (value.length <= 3 && value.every((v) => typeof v === 'number')) {
            return `[${value.join(', ')}]`;
        }
        // 其他数组展开显示
        const items = value.map((v) => `${prefix}  ${FormatAMFValue(v, indent + 1)}`);
        return `[\n${items.join(',\n')}\n${prefix}]`;
    }
    if (typeof value === 'object') {
        const obj = value;
        const keys = Object.keys(obj);
        if (keys.length === 0)
            return '{}';
        // 特殊处理 Point 对象 - 检查 x 和 y 是否为数字
        if ('x' in obj && 'y' in obj && keys.length <= 3) {
            const x = typeof obj.x === 'number' ? obj.x : obj.x;
            const y = typeof obj.y === 'number' ? obj.y : obj.y;
            return `Point(${x}, ${y})`;
        }
        const items = keys.map((k) => `${prefix}  ${k}: ${FormatAMFValue(obj[k], indent + 1)}`);
        return `{\n${items.join(',\n')}\n${prefix}}`;
    }
    return String(value);
}
//# sourceMappingURL=AMFDecoder.js.map