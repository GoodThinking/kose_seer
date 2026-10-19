import type { IPetInfo } from '../../../shared/models/PetModel';

/** Declaration of the deployed PetPP.js helper. The implementation stays in the running server. */
export declare function ReconcilePetPP(pet: IPetInfo, refill?: boolean): Record<number, number>;
