"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveClientProtocol = ResolveClientProtocol;
function ResolveClientProtocol(value) {
    if (value === undefined)
        return 'kose';
    if (value === 'kose' || value === 'xin-20261013')
        return value;
    throw new Error(`Unsupported services.game.clientProtocol: ${String(value)}`);
}
//# sourceMappingURL=ClientProtocol.js.map