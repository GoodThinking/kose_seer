import { PacketParser } from '../PacketParser';
import { Logger } from '../../utils';
import { CmdMeta } from '../CommandMeta';

describe('credential packet logging', () => {
  afterEach(() => jest.restoreAllMocks());
  test.each([2, 104, 1001])('command %i preserves payload without decoding it into logs', cmd => {
    const secret = Buffer.from('synthetic-password-invite-session');
    const frame = Buffer.alloc(17 + secret.length);
    frame.writeUInt32BE(frame.length); frame.write('1', 4); frame.writeUInt32BE(cmd, 5); secret.copy(frame, 17);
    const debug = jest.spyOn(Logger, 'Debug').mockImplementation(() => {});
    jest.spyOn(Logger, 'Info').mockImplementation(() => {});
    const decode = jest.spyOn(CmdMeta, 'ParseBody');
    const parser = new PacketParser(); parser.Append(frame.subarray(0, 20)); expect(parser.TryParse()).toBeNull();
    parser.Append(frame.subarray(20)); expect(parser.TryParse()!.body).toEqual(secret);
    expect(decode).not.toHaveBeenCalled();
    expect(debug.mock.calls.flat().join(' ')).not.toContain(secret.toString());
    expect(parser.TryParse()).toBeNull();
  });
  test('invalid length logging excludes raw packet bytes', () => {
    const secret = Buffer.from('synthetic-secret');
    const frame = Buffer.alloc(4 + secret.length); frame.writeUInt32BE(8388609); secret.copy(frame, 4);
    const error = jest.spyOn(Logger, 'Error').mockImplementation(() => {});
    jest.spyOn(Logger, 'Debug').mockImplementation(() => {});
    const parser = new PacketParser(); parser.Append(frame); expect(parser.TryParse()).toBeNull();
    expect(error.mock.calls.flat().join(' ')).not.toContain(secret.toString('hex'));
  });
});
