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
exports.PuniConfig = void 0;
const utils_1 = require("../../utils");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PuniConfig {
    static _instance;
    _seals = [];
    _loaded = false;
    constructor() { }
    static get Instance() {
        if (!PuniConfig._instance) {
            PuniConfig._instance = new PuniConfig();
        }
        return PuniConfig._instance;
    }
    Load() {
        if (this._loaded) {
            return;
        }
        try {
            const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'puni_config.json');
            const configData = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(configData);
            if (config.puniSeals) {
                this._seals = config.puniSeals;
            }
            this._loaded = true;
            utils_1.Logger.Info(`[PuniConfig] Loaded ${this._seals.length} seals`);
        }
        catch (error) {
            utils_1.Logger.Error('[PuniConfig] Failed to load puni config', error);
        }
    }
    GetSeal(doorIndex) {
        if (!this._loaded) {
            this.Load();
        }
        return this._seals.find(s => s.doorIndex === doorIndex);
    }
    GetAllSeals() {
        if (!this._loaded) {
            this.Load();
        }
        return this._seals;
    }
    GetSealCount() {
        if (!this._loaded) {
            this.Load();
        }
        return this._seals.length;
    }
}
exports.PuniConfig = PuniConfig;
//# sourceMappingURL=PuniConfig.js.map