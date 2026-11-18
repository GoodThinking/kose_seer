"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunInvitationCLI = RunInvitationCLI;
/** Operator CLI. Uses an explicit existing SQLite database; never sends invitations over the network. */
const path_1 = require("path");
const fs_1 = require("fs");
async function RunInvitationCLI(args) {
    const [command, ...pairs] = args;
    const options = new Map();
    if (pairs.length % 2 !== 0)
        throw new Error('Expected option/value pairs');
    for (let i = 0; i < pairs.length; i += 2) {
        if (options.has(pairs[i]))
            throw new Error('Duplicate option');
        options.set(pairs[i], pairs[i + 1]);
    }
    const allowed = command === 'create' ? ['--db', '--ttl'] : ['--db', '--hash'];
    if (!['create', 'revoke', 'status'].includes(command) || [...options.keys()].some(k => !allowed.includes(k))) {
        throw new Error('Usage: create --db /ABS/existing.sqlite --ttl SECONDS | revoke/status --db /ABS/existing.sqlite --hash SHA256');
    }
    const filename = options.get('--db');
    if (!filename || !(0, path_1.isAbsolute)(filename) || !(0, fs_1.existsSync)(filename))
        throw new Error('An existing absolute SQLite path is required');
    const { Config } = await Promise.resolve().then(() => __importStar(require('./shared/config/ServerConfig')));
    Config.Config.database = { type: 'sqlite', path: filename };
    const { DatabaseManager } = await Promise.resolve().then(() => __importStar(require('./DataBase/DatabaseManager')));
    const { InvitationRepository } = await Promise.resolve().then(() => __importStar(require('./DataBase/repositories/Player/InvitationRepository')));
    await DatabaseManager.Instance.Initialize();
    try {
        const repository = new InvitationRepository();
        if (command === 'create') {
            const raw = options.get('--ttl');
            if (!raw || !/^[1-9]\d*$/.test(raw))
                throw new Error('A positive TTL in seconds is required');
            const invite = await repository.Create(Number(raw));
            // This is the only plaintext output; the value cannot be retrieved later.
            process.stdout.write(JSON.stringify(invite) + '\n');
        }
        else {
            const hash = options.get('--hash') ?? '';
            const result = command === 'revoke' ? { revoked: await repository.Revoke(hash) } : await repository.Status(hash);
            process.stdout.write(JSON.stringify(result) + '\n');
        }
    }
    finally {
        await DatabaseManager.Instance.Shutdown();
    }
}
if (require.main === module) {
    RunInvitationCLI(process.argv.slice(2)).catch(() => {
        process.stderr.write('Invitation command failed. Check arguments, database permissions and migration 020.\n');
        process.exitCode = 1;
    });
}
//# sourceMappingURL=invite-entry.js.map