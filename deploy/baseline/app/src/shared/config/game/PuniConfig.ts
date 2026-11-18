import { Logger } from '../../utils';
import * as fs from 'fs';
import * as path from 'path';

export interface ITrueFormLife {
  lifeIndex: number;
  hp: number;
  autoHealThreshold: number;
}

export interface IPuniSeal {
  doorIndex: number;
  name: string;
  hp: number;
  rewardItemId: number;
  playerAccuracyMod: number;
  enemyAtkMod: number;
  enemySpAtkMod: number;
  elementOnlyTypes: number[] | null;
  energyDamageLimit: number;
  lifeHealPerTurn: number;
  cycleHPBars: number;
  eternalDamageReduction: boolean;
  holyStatDropImmune: boolean;
  trueFormLives: ITrueFormLife[] | null;
}

export interface IPuniConfig {
  puniSeals: IPuniSeal[];
}

export class PuniConfig {
  private static _instance: PuniConfig;
  private _seals: IPuniSeal[] = [];
  private _loaded: boolean = false;

  private constructor() {}

  public static get Instance(): PuniConfig {
    if (!PuniConfig._instance) {
      PuniConfig._instance = new PuniConfig();
    }
    return PuniConfig._instance;
  }

  public Load(): void {
    if (this._loaded) {
      return;
    }

    try {
      const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'puni_config.json');
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: IPuniConfig = JSON.parse(configData);

      if (config.puniSeals) {
        this._seals = config.puniSeals;
      }

      this._loaded = true;
      Logger.Info(`[PuniConfig] Loaded ${this._seals.length} seals`);
    } catch (error) {
      Logger.Error('[PuniConfig] Failed to load puni config', error as Error);
    }
  }

  public GetSeal(doorIndex: number): IPuniSeal | undefined {
    if (!this._loaded) {
      this.Load();
    }
    return this._seals.find(s => s.doorIndex === doorIndex);
  }

  public GetAllSeals(): IPuniSeal[] {
    if (!this._loaded) {
      this.Load();
    }
    return this._seals;
  }

  public GetSealCount(): number {
    if (!this._loaded) {
      this.Load();
    }
    return this._seals.length;
  }
}
