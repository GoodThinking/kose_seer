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
export declare class PuniConfig {
    private static _instance;
    private _seals;
    private _loaded;
    private constructor();
    static get Instance(): PuniConfig;
    Load(): void;
    GetSeal(doorIndex: number): IPuniSeal | undefined;
    GetAllSeals(): IPuniSeal[];
    GetSealCount(): number;
}
//# sourceMappingURL=PuniConfig.d.ts.map