import { IPetInfo } from '../../../shared/models/PetModel';
import { PetCalculator } from './PetCalculator';

export function rollIndividualValue(): number {
  return Math.floor(Math.random() * 32);
}

/** Replace all six individual values. Level, nature, effort values, skills and experience stay. */
export function applyRandomIndividualValues(pet: IPetInfo, roll: () => number = rollIndividualValue): void {
  pet.dvHp = roll();
  pet.dvAtk = roll();
  pet.dvDef = roll();
  pet.dvSpAtk = roll();
  pet.dvSpDef = roll();
  pet.dvSpeed = roll();
  PetCalculator.UpdatePetStats(pet);
}
