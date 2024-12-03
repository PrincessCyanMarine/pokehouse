import { GAMES } from "./GAMES";
import { SAV } from "./SAV";
import { Species } from "./Species";

export type Pokemon = {
  Context: string;
  PersonalInfo: string;
  EncryptionConstant: string;
  Sanity: string;
  Checksum: string;
  Species: number;
  HeldItem: number;
  ID32: string;
  TID16: string;
  SID16: string;
  EXP: string;
  Ability: string;
  AbilityNumber: string;
  MarkValue: string;
  PID: string;
  Nature: string;
  FatefulEncounter: string;
  Gender: string;
  Form: number;
  EV_HP: number;
  EV_ATK: number;
  EV_DEF: number;
  EV_SPE: number;
  EV_SPA: number;
  EV_SPD: number;
  CNT_Cool: string;
  CNT_Beauty: string;
  CNT_Cute: string;
  CNT_Smart: string;
  CNT_Tough: string;
  CNT_Sheen: string;
  ResortEventStatus?: string;
  PKRS?: string;
  PKRS_Days: string;
  PKRS_Strain: string;
  Unused0?: string;
  Unused1: string;
  SuperTrain1_SPA?: string;
  SuperTrain1_HP?: string;
  SuperTrain1_ATK?: string;
  SuperTrain1_SPD?: string;
  SuperTrain1_SPE?: string;
  SuperTrain1_DEF?: string;
  SuperTrain2_SPA?: string;
  SuperTrain2_HP?: string;
  SuperTrain2_ATK?: string;
  SuperTrain2_SPD?: string;
  SuperTrain2_SPE?: string;
  SuperTrain2_DEF?: string;
  SuperTrain3_SPA?: string;
  SuperTrain3_HP?: string;
  SuperTrain3_ATK?: string;
  SuperTrain3_SPD?: string;
  SuperTrain3_SPE?: string;
  SuperTrain3_DEF?: string;
  SuperTrain4_1?: string;
  SuperTrain5_1?: string;
  SuperTrain5_2?: string;
  SuperTrain5_3?: string;
  SuperTrain5_4?: string;
  SuperTrain6_1?: string;
  SuperTrain6_2?: string;
  SuperTrain6_3?: string;
  SuperTrain7_1?: string;
  SuperTrain7_2?: string;
  SuperTrain7_3?: string;
  SuperTrain8_1?: string;
  SuperTrainBitFlags?: string;
  RibbonChampionKalos?: string;
  RibbonChampionG3: string;
  RibbonChampionSinnoh?: string;
  RibbonBestFriends?: string;
  RibbonTraining?: string;
  RibbonBattlerSkillful?: string;
  RibbonBattlerExpert?: string;
  RibbonEffort: string;
  RibbonAlert?: string;
  RibbonShock?: string;
  RibbonDowncast?: string;
  RibbonCareless?: string;
  RibbonRelax?: string;
  RibbonSnooze?: string;
  RibbonSmile?: string;
  RibbonGorgeous?: string;
  RibbonRoyal?: string;
  RibbonGorgeousRoyal?: string;
  RibbonArtist: string;
  RibbonFootprint?: string;
  RibbonRecord?: string;
  RibbonLegend?: string;
  RibbonCountry: string;
  RibbonNational: string;
  RibbonEarth: string;
  RibbonWorld: string;
  RibbonClassic?: string;
  RibbonPremier?: string;
  RibbonEvent?: string;
  RibbonBirthday?: string;
  RibbonSpecial?: string;
  RibbonSouvenir?: string;
  RibbonWishing?: string;
  RibbonChampionBattle: string;
  RibbonChampionRegional: string;
  RibbonChampionNational: string;
  RibbonChampionWorld?: string;
  HasContestMemoryRibbon?: string;
  HasBattleMemoryRibbon?: string;
  RibbonChampionG6Hoenn?: string;
  RibbonContestStar?: string;
  RibbonMasterCoolness?: string;
  RibbonMasterBeauty?: string;
  RibbonMasterCuteness?: string;
  RibbonMasterCleverness?: string;
  RibbonMasterToughness?: string;
  RibbonChampionAlola?: string;
  RibbonBattleRoyale?: string;
  RibbonBattleTreeGreat?: string;
  RibbonBattleTreeMaster?: string;
  RIB6_2?: string;
  RIB6_3?: string;
  RIB6_4?: string;
  RIB6_5?: string;
  RIB6_6?: string;
  RIB6_7?: string;
  RibbonCountMemoryContest?: string;
  RibbonCountMemoryBattle?: string;
  DistSuperTrain1?: string;
  DistSuperTrain2?: string;
  DistSuperTrain3?: string;
  DistSuperTrain4?: string;
  DistSuperTrain5?: string;
  DistSuperTrain6?: string;
  Dist7?: string;
  Dist8?: string;
  FormArgument?: string;
  FormArgumentRemain?: string;
  FormArgumentElapsed?: string;
  FormArgumentMaximum?: string;
  RibbonCount: string;
  Nickname: string;
  Move1: string;
  Move2: string;
  Move3: string;
  Move4: string;
  Move1_PP: string;
  Move2_PP: string;
  Move3_PP: string;
  Move4_PP: string;
  Move1_PPUps: string;
  Move2_PPUps: string;
  Move3_PPUps: string;
  Move4_PPUps: string;
  RelearnMove1: string;
  RelearnMove2: string;
  RelearnMove3: string;
  RelearnMove4: string;
  SecretSuperTrainingUnlocked?: string;
  SecretSuperTrainingComplete?: string;
  IV_HP: number;
  IV_ATK: number;
  IV_DEF: number;
  IV_SPE: number;
  IV_SPA: number;
  IV_SPD: number;
  IsEgg: boolean;
  IsNicknamed: boolean;
  HT_Name: string;
  HT_Gender: string;
  CurrentHandler: string;
  Geo1_Region?: string;
  Geo1_Country?: string;
  Geo2_Region?: string;
  Geo2_Country?: string;
  Geo3_Region?: string;
  Geo3_Country?: string;
  Geo4_Region?: string;
  Geo4_Country?: string;
  Geo5_Region?: string;
  Geo5_Country?: string;
  HT_Friendship: string;
  HT_Affection?: string;
  HT_Intensity?: string;
  HT_Memory?: string;
  HT_Feeling?: string;
  HT_TextVar?: string;
  Fullness: string;
  Enjoyment: string;
  OT_Name: string;
  OT_Friendship: string;
  OT_Affection?: string;
  OT_Intensity?: string;
  OT_Memory?: string;
  OT_TextVar?: string;
  OT_Feeling?: string;
  Egg_Year: string;
  Egg_Month: string;
  Egg_Day: string;
  Met_Year: string;
  Met_Month: string;
  Met_Day: string;
  Egg_Location: string;
  Met_Location: string;
  Ball: string;
  Met_Level: string;
  OT_Gender: string;
  HyperTrainFlags?: string;
  HT_HP?: string;
  HT_ATK?: string;
  HT_DEF?: string;
  HT_SPA?: string;
  HT_SPD?: string;
  HT_SPE?: string;
  Version: string;
  Country?: string;
  Region?: string;
  ConsoleRegion?: string;
  Language: string;
  Status_Condition: string;
  Stat_Level: string;
  DirtType?: string;
  DirtLocation?: string;
  Stat_HPCurrent: string;
  Stat_HPMax: string;
  Stat_ATK: string;
  Stat_DEF: string;
  Stat_SPE: string;
  Stat_SPA: string;
  Stat_SPD: string;
  IsUntradedEvent6?: string;
  MarkingCount: string;
  MaxMoveID: string;
  MaxSpeciesID: string;
  MaxAbilityID: string;
  MaxItemID: string;
  MaxBallID: string;
  MaxGameID: string;
  SIZE_PARTY: string;
  SIZE_STORED: string;
  ChecksumValid: string;
  Valid: string;
  CurrentFriendship: string;
  OppositeFriendship?: string;
  PSV: string;
  TSV: string;
  IsUntraded: string;
  Characteristic: string;
  MaxIV: number;
  MaxEV: number;
  MaxStringLengthOT: string;
  MaxStringLengthNickname: string;
  Extension: string;
  EncryptedPartyData: string;
  EncryptedBoxData: string;
  DecryptedPartyData: string;
  DecryptedBoxData: string;
  Format: number;
  TrainerIDDisplayFormat: string;
  StatNature: string;
  TrainerTID7: string;
  TrainerSID7: string;
  DisplayTID: string;
  DisplaySID: string;
  Japanese: string;
  Korean: string;
  MetDate: string;
  EggMetDate: string;
  MinGameID: string;
  SpriteItem: string;
  IsShiny: boolean;
  ShinyXor: string;
  E: string;
  FRLG: string;
  Pt: string;
  HGSS: string;
  BW: string;
  B2W2: string;
  XY: string;
  AO: string;
  SM: string;
  USUM: string;
  GO: string;
  VC1: string;
  VC2: string;
  LGPE: string;
  SWSH: string;
  BDSP: string;
  LA: string;
  SV: string;
  GO_LGPE: string;
  GO_HOME: string;
  VC: string;
  GG: string;
  Gen9: string;
  Gen8: string;
  Gen7: string;
  Gen6: string;
  Gen5: string;
  Gen4: string;
  Gen3: string;
  Gen2: string;
  Gen1: string;
  GenU: string;
  Generation: number;
  PKRS_Infected: string;
  PKRS_Cured: string;
  CurrentLevel: string;
  IVTotal: number;
  EVTotal: number;
  MaximumIV: number;
  FlawlessIVCount: string;
  FileName: string;
  FileNameWithoutExtension: string;
  IVs: string;
  Stats: string;
  Moves: string;
  MoveCount: string;
  RelearnMoves: string;
  PIDAbility: string;
  HPPower: string;
  HPType: string;
  WasEgg: string;
  WasTradedEgg: string;
  IsTradedEgg: string;
  IsNative: string;
  IsOriginValid: string;
  HasOriginalMetLocation: string;
  PotentialRating: string;
  PartyStatsPresent: string;
  FlagIsBadEgg?: string;
  FlagHasSpecies?: string;
  FlagIsEgg?: string;
  SpeciesInternal?: string;
  AbilityBit?: string;
  RibbonCountG3Cool?: string;
  RibbonCountG3Beauty?: string;
  RibbonCountG3Cute?: string;
  RibbonCountG3Smart?: string;
  RibbonCountG3Tough?: string;
  RibbonWinning?: string;
  RibbonVictory?: string;
  Unused2?: string;
  Unused3?: string;
  Unused4?: string;
  HeldMailID?: string;

  Permit: string;
  IsFavorite: string;
  CanGigantamax: string;
  IsAlpha: boolean;
  IsNoble: boolean;
  Flag2: string;
  AlphaMove: string;
  RibbonMarkMisty: string;
  RibbonMarkDestiny: string;
  RibbonMarkFishing: string;
  RibbonMarkCurry: string;
  RibbonMarkUncommon: string;
  RibbonMarkRare: string;
  RibbonMarkRowdy: string;
  RibbonMarkAbsentMinded: string;
  RibbonMarkJittery: string;
  RibbonMarkExcited: string;
  RibbonMarkCharismatic: string;
  RibbonMarkCalmness: string;
  RibbonMarkIntense: string;
  RibbonMarkZonedOut: string;
  RibbonMarkJoyful: string;
  RibbonMarkAngry: string;
  RibbonMarkSmiley: string;
  RibbonMarkTeary: string;
  RibbonMarkUpbeat: string;
  RibbonMarkPeeved: string;
  RibbonMarkIntellectual: string;
  RibbonMarkFerocious: string;
  RibbonMarkCrafty: string;
  RibbonMarkScowling: string;
  RibbonMarkKindly: string;
  RibbonMarkFlustered: string;
  RibbonMarkPumpedUp: string;
  RibbonMarkZeroEnergy: string;
  RibbonMarkPrideful: string;
  RibbonMarkUnsure: string;
  RibbonMarkHumble: string;
  RibbonMarkThorny: string;
  RibbonMarkVigor: string;
  RibbonMarkSlump: string;
  RibbonHisui: string;
  RibbonTwinklingStar: string;
  RibbonChampionPaldea: string;
  RibbonMarkJumbo: string;
  RibbonMarkMini: string;
  RibbonMarkItemfinder: string;
  RibbonMarkPartner: string;
  RibbonMarkGourmand: string;
  RibbonOnceInALifetime: string;
  RibbonMarkAlpha: string;
  RibbonMarkMightiest: string;
  RibbonMarkTitan: string;
  RIB45_6: string;
  RIB45_7: string;
  RIB46_0: string;
  RIB46_1: string;
  RIB46_2: string;
  RIB46_3: string;
  RIB46_4: string;
  RIB46_5: string;
  RIB46_6: string;
  RIB46_7: string;
  RIB47_0: string;
  RIB47_1: string;
  RIB47_2: string;
  RIB47_3: string;
  RIB47_4: string;
  RIB47_5: string;
  RIB47_6: string;
  RIB47_7: string;
  MarkCount: string;
  RibbonMarkCount: string;
  HasMarkEncounter8: string;
  HasMarkEncounter9: string;
  Sociability: string;
  HeightScalar: string;
  WeightScalar: string;
  Scale: string;
  DynamaxLevel: string;
  UnkA0: string;
  GV_HP: string;
  GV_ATK: string;
  GV_DEF: string;
  GV_SPE: string;
  GV_SPA: string;
  GV_SPD: string;
  HeightAbsolute: string;
  WeightAbsolute: string;
  HT_Language: string;
  HT_TrainerID: string;
  BattleVersion: string;
  UnkF3: string;
  AffixedRibbon: string;
  Tracker: string;
  HeightRatio: string;
  WeightRatio: string;
  CalcHeightAbsolute: string;
  CalcWeightAbsolute: string;
  Type: string;
  moving?: boolean | null;
  sortedPos?: number;
};

export const isSamePokemon = (p: Pokemon, pkm: Pokemon) => {
  return (
    p.Species == pkm.Species &&
    p.Form == pkm.Form &&
    p.PID == pkm.PID &&
    p.TID16 == pkm.TID16 &&
    p.SID16 == pkm.SID16 &&
    p.Nature == pkm.Nature &&
    p.Ability == pkm.Ability &&
    p.HeldItem == pkm.HeldItem &&
    p.Move1 == pkm.Move1 &&
    p.Move2 == pkm.Move2 &&
    p.Move3 == pkm.Move3 &&
    p.Move4 == pkm.Move4 &&
    p.IV_HP == pkm.IV_HP &&
    p.IV_ATK == pkm.IV_ATK &&
    p.IV_DEF == pkm.IV_DEF &&
    p.IV_SPA == pkm.IV_SPA &&
    p.IV_SPD == pkm.IV_SPD &&
    p.IV_SPE == pkm.IV_SPE &&
    p.EV_HP == pkm.EV_HP &&
    p.EV_ATK == pkm.EV_ATK &&
    p.EV_DEF == pkm.EV_DEF &&
    p.EV_SPA == pkm.EV_SPA &&
    p.EV_SPD == pkm.EV_SPD &&
    p.EV_SPE == pkm.EV_SPE &&
    p.IsShiny == pkm.IsShiny
  );
};

export const HasTotemForm = (species: Species) => {
  switch (species) {
    case Species.Raticate:
      return true;
    case Species.Marowak:
      return true;
    case Species.Gumshoos:
      return true;
    case Species.Vikavolt:
      return true;
    case Species.Ribombee:
      return true;
    case Species.Araquanid:
      return true;
    case Species.Lurantis:
      return true;
    case Species.Salazzle:
      return true;
    case Species.Mimikyu:
      return true;
    case Species.Kommoo:
      return true;
    case Species.Togedemaru:
      return true;
    default:
      return false;
  }
};

export const IsTotemForm = (pkm: Pokemon) => {
  let form = pkm.Form;
  let species = pkm.Species as Species;
  if (form == 0) return false;
  if (!HasTotemForm(species)) return false;
  if (species == Species.Mimikyu) return form == 2 || form == 3;
  if (species == Species.Raticate || species == Species.Marowak)
    return form == 2;
  return form == 1;
};
export const isPartnerMon = (pkm: Pokemon) => {
  if (![Species.Pikachu, Species.Eevee].includes(pkm.Species)) return false;
  return pkm.Form == 1;
};

export const getItemSprite = (pkm: Pokemon) => {
  let item = pkm.HeldItem;
  if (!item || item == 0) return "";
  return `https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Drawing.PokeSprite/Resources/img/Big%20Items/bitem_${item}.png`;
};

export const getSprite = (pkm: Pokemon, sav?: SAV | null) => {
  let actualForm =
    IsTotemForm(pkm) || isPartnerMon(pkm) ? pkm.Form - 1 : pkm.Form;
  let species = pkm?.Species;
  let imageBase = pkm.IsShiny
    ? "Big%20Shiny%20Sprites"
    : "Big%20Pokemon%20Sprites";
  let imageArceus = pkm.IsShiny
    ? "Legends%20Arceus%20Shiny%20Sprites"
    : "Legends%20Arceus%20Sprites";
  let isPLA = pkm.Species > 0 && sav?.Game == GAMES.PLA;
  let imageURL = isPLA ? imageArceus : pkm.Species >= 906 ? "Artwork Pokemon Sprites" : imageBase;

  return `https://raw.githubusercontent.com/kwsch/PKHeX/master/PKHeX.Drawing.PokeSprite/Resources/img/${imageURL}/${
    isPLA ? "c" : pkm.Species >= 906 ? "a" : "b"
  }_${species}${actualForm > 0 ? "-" + actualForm : ""}${
    pkm.IsShiny && pkm.Species < 906 ? "s" : ""
  }.png`;
};

export const cleanPokemonData = (pkm: Pokemon): Pokemon => {
  let p = { ...pkm };
  let numbers: (keyof Pokemon)[] = [
    "Format",
    "Generation",
    "Species",
    "Form",
    "IVTotal",
    "EVTotal",
    "MaximumIV",
    "IV_ATK",
    "IV_DEF",
    "IV_HP",
    "IV_SPA",
    "IV_SPD",
    "IV_SPE",
    "EV_ATK",
    "EV_DEF",
    "EV_HP",
    "EV_SPA",
    "EV_SPD",
    "EV_SPE",
    "MaxIV",
    "MaxEV",
    "HeldItem",
  ];
  let booleans: (keyof Pokemon)[] = [
    "IsNicknamed",
    "IsEgg",
    "IsShiny",
    "IsAlpha",
    "IsNoble",
    "LA",
  ];
  for (let key of numbers) {
    (p as any)[key] = parseInt(p[key] as unknown as string);
  }
  for (let key of booleans) {
    (p as any)[key] = (p[key] as unknown as string) == "True";
  }
  p.IsShiny = p.IsShiny && p.Species != 0;

  return p;
};
