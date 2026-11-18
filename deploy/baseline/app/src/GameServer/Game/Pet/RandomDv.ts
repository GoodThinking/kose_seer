import { IPetInfo } from '../../../shared/models/PetModel';
import { PetCalculator } from './PetCalculator';

export function rollIndividualValue(): number {
  return Math.floor(Math.random() * 32);
}

/** Roll one individual value for all six stats. Preserve level, nature, effort, skills and experience. */
export function applyRandomIndividualValues(pet: IPetInfo, roll: () => number = rollIndividualValue): void {
  const dv = roll();
  pet.dvHp = dv;
  pet.dvAtk = dv;
  pet.dvDef = dv;
  pet.dvSpAtk = dv;
  pet.dvSpDef = dv;
  pet.dvSpeed = dv;
  PetCalculator.UpdatePetStats(pet);
}
