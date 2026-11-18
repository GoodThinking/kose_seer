import { Logger } from '../../utils';
import * as fs from 'fs';
import * as path from 'path';

export interface IAlderLife {
  hp: number;
  startStages?: number[];
  priority?: number;
  skills?: number[];
  stealStats?: boolean;
  turnStatus?: boolean;
  lifesteal?: boolean;
  infinitePP?: boolean;
  instantKillImmune?: boolean;
  ppCostMultiplier?: number;
}

export interface IAlderTrial {
  doorIndex: number;
  name: string;
  level: number;
  hp: number;
  startStages?: number[];
  priority?: number;
  skills?: number[];
  statClearImmune?: boolean;
  damageCap?: number;
  healPerTurn?: number;
  lifesteal?: boolean;
  turnStatus?: boolean;
  instantKillImmune?: boolean;
  ppCostMultiplier?: number;
}

export interface IAlderTrueForm {
  doorIndex: number;
  name: string;
  lives: IAlderLife[];
}

export interface IAlderConfig {
  version: number;
  mapId: number;
  trials: IAlderTrial[];
  trueForm: IAlderTrueForm;
}

export class AlderConfig {
  private static _instance: AlderConfig;
  private _config: IAlderConfig | null = null;
  private _loaded: boolean = false;

  private constructor() {}

  public static get Instance(): AlderConfig {
    if (!AlderConfig._instance) {
      AlderConfig._instance = new AlderConfig();
    }
    return AlderConfig._instance;
  }

  public Load(): void {
    if (this._loaded) return;
    try {
      const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'alder_config.json');
      const config: IAlderConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!Array.isArray(config.trials) || !Array.isArray(config.trueForm?.lives)) {
        throw new Error('alder_config.json missing trials or trueForm.lives');
      }
      this._config = config;
      this._loaded = true;
      Logger.Info(`[AlderConfig] Loaded ${config.trials.length} trials and ${config.trueForm.lives.length} lives`);
    } catch (error) {
      Logger.Error('[AlderConfig] Failed to load alder config', error as Error);
    }
  }

  public Get(): IAlderConfig | null {
    if (!this._loaded) this.Load();
    return this._config;
  }

  public GetMapId(): number {
    return this.Get()?.mapId || 668;
  }

  public GetTrial(doorIndex: number): IAlderTrial | undefined {
    return this.Get()?.trials.find(t => t.doorIndex === doorIndex);
  }

  public GetTrueForm(): IAlderTrueForm | undefined {
    return this.Get()?.trueForm;
  }
}
