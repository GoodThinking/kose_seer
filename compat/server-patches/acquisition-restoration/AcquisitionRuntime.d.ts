// Existing deployed JS APIs absent from the older source tree. No runtime implementations or aliases.
import type { IDriver } from '../../../DataBase/drivers/IDriver';
import type { IPetInfo } from '../../../shared/models/PetModel';
import '../../../DataBase/DatabaseManager';
import '../../../DataBase/models/PetData';
import '../../../DataBase/models/ItemData';
import '../../../DataBase/models/PlayerData';
import '../Player/PlayerInstance';

declare module '../../../DataBase/DatabaseManager' {
  interface DatabaseManager { WithConnection<T>(work: (driver: IDriver) => Promise<T>): Promise<T> }
}
declare module '../../../DataBase/models/PlayerData' {
  interface BalanceRewardGate { publish(coins: number, gold: number, exp: number): void; release(): void }
  interface PlayerData {
    WaitForExpAllocation(): Promise<void>;
    WaitForCurrencyOperations(): Promise<void>;
    BeginBalanceReward(): BalanceRewardGate;
  }
}
declare module '../../../DataBase/models/PetData' {
  interface PetData {
    AcquireMutation(): Promise<() => void>;
    WaitForStagedSave(): Promise<void>;
    ReserveIdentity(time: number): () => void;
    CommitPetUpdate(pet: IPetInfo, candidate: IPetInfo, persist?: (staged: PetData) => Promise<void>, publish?: () => void): Promise<void>;
  }
}
declare module '../../../DataBase/models/ItemData' {
  interface ItemData { AcquireReward(): Promise<() => void> }
}
declare module '../../../shared/models/PetModel' {
  interface IPetInfo { skillPP?: Record<number, number> }
}
declare module '../Player/PlayerInstance' {
  interface PlayerInstance { readonly ClientProtocol: string }
}
