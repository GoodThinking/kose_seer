"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlderConfig = void 0;
const utils_1 = require("../../utils");
const fs = require("fs");
const path = require("path");
class AlderConfig {
    static _instance;
    _config = null;
    _loaded = false;
    constructor() { }
    static get Instance() {
        if (!AlderConfig._instance) {
            AlderConfig._instance = new AlderConfig();
        }
        return AlderConfig._instance;
    }
    Load() {
        if (this._loaded)
            return;
        try {
            const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'alder_config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (!Array.isArray(config.trials) || !Array.isArray(config.trueForm?.lives)) {
                throw new Error('alder_config.json missing trials or trueForm.lives');
            }
            this._config = config;
            this._loaded = true;
            utils_1.Logger.Info(`[AlderConfig] Loaded ${config.trials.length} trials and ${config.trueForm.lives.length} lives`);
        }
        catch (error) {
            utils_1.Logger.Error('[AlderConfig] Failed to load alder config', error);
        }
    }
    Get() {
        if (!this._loaded)
            this.Load();
        return this._config;
    }
    GetMapId() {
        return this.Get()?.mapId || 668;
    }
    GetTrial(doorIndex) {
        return this.Get()?.trials.find(t => t.doorIndex === doorIndex);
    }
    GetTrueForm() {
        return this.Get()?.trueForm;
    }
}
exports.AlderConfig = AlderConfig;
