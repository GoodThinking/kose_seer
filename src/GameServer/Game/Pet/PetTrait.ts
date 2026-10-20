import { GameConfig } from '../../../shared/config/game/GameConfig';
import type { IPetEffectInfo, IPetInfo } from '../../../shared/models/PetModel';

/** 天生特性，对应 skill_effects.xml 里 1006–1045。能量珠特效不在这个池子里。 */
const TRAIT_MIN = 1006;
const TRAIT_MAX = 1045;

type AbilityConfig = { abilityId: number; args?: number[] };
type TraitItem = {
  NewSeReset?: number | string;
  NonFuseResetNewse?: number | string;
  NonFuseAddNewse?: number | string;
  LimitPetClass?: string;
};

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function petConfig(petId: number): any {
  return GameConfig.GetPetById(petId) as any;
}

/** 任何种族都能带特性。AddSeParam 只是官方表里的标记，不拿来拦药。 */
export function speciesAllowsTrait(_petId: number): boolean {
  return true;
}

export function isFusionSpecies(petId: number): boolean {
  const info = petConfig(petId);
  return num(info?.BreedingMon ?? info?.breedingmon) === 1;
}

function traitPool(): AbilityConfig[] {
  return GameConfig.GetAllPetAbilities().filter(ability => {
    const id = num(ability?.abilityId);
    return id >= TRAIT_MIN && id <= TRAIT_MAX;
  });
}

export function rollTrait(exceptId = 0): AbilityConfig | null {
  const pool = traitPool();
  const choices = exceptId > 0 ? pool.filter(ability => num(ability.abilityId) !== exceptId) : pool;
  const list = choices.length > 0 ? choices : pool;
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function currentTraitId(pet: IPetInfo): number {
  const effect = pet.effectList && pet.effectList[0];
  return num(effect?.effectID || effect?.itemId);
}

export function applyTrait(pet: IPetInfo, ability: AbilityConfig): void {
  const effect: IPetEffectInfo = {
    itemId: ability.abilityId,
    status: 2,
    leftCount: -1,
    effectID: ability.abilityId,
    args: (ability.args || []).join(' '),
  };
  pet.effectList = [effect];
  pet.effectCount = 1;
}

/** 新个体生成时调用。已经有特性时不改。 */
export function assignInnateTrait(pet: IPetInfo): void {
  if (pet.effectList && pet.effectList.length > 0) return;
  if (!speciesAllowsTrait(pet.petId)) return;
  const trait = rollTrait();
  if (!trait) return;
  applyTrait(pet, trait);
}

export function isTraitItem(item: TraitItem | null | undefined): boolean {
  if (!item) return false;
  return num(item.NewSeReset) === 1 || num(item.NonFuseResetNewse) > 0 || num(item.NonFuseAddNewse) === 1;
}

function allowsPetClass(item: TraitItem, petId: number): boolean {
  if (!item.LimitPetClass) return true;
  const allowed = String(item.LimitPetClass).trim().split(/\s+/).map(num).filter(id => id > 0);
  if (allowed.length === 0) return true;
  return allowed.includes(num(petConfig(petId)?.PetClass));
}

/** ok 已写上特性；reject 不扣药；skip 不是特性药。 */
export function applyTraitItem(pet: IPetInfo, item: TraitItem | null | undefined): 'ok' | 'reject' | 'skip' {
  if (!isTraitItem(item) || !item) return 'skip';
  if (!allowsPetClass(item, pet.petId) || !speciesAllowsTrait(pet.petId)) return 'reject';

  const fusion = isFusionSpecies(pet.petId);
  const fusionReset = num(item.NewSeReset) === 1;
  const openTrait = num(item.NonFuseAddNewse) === 1;
  const resetValue = num(item.NonFuseResetNewse);
  if (fusionReset && !fusion) return 'reject';
  if ((openTrait || resetValue > 0) && fusion) return 'reject';

  const current = currentTraitId(pet);
  if (openTrait) {
    if (current > 0) return 'reject';
    const trait = rollTrait();
    if (!trait) return 'reject';
    applyTrait(pet, trait);
    return 'ok';
  }

  if (resetValue > 1) {
    const forced = GameConfig.GetPetAbilityById(resetValue) as AbilityConfig | null;
    if (!forced || current === resetValue) return 'reject';
    applyTrait(pet, forced);
    return 'ok';
  }

  const trait = rollTrait(current);
  if (!trait) return 'reject';
  applyTrait(pet, trait);
  return 'ok';
}
