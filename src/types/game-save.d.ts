import { DataState, DialogKey, SkillsState } from "./vuex";

export interface GameSave {
  data: DataState;
  skills: SkillsState;
  dialog: DialogKey[];
  lastLabel: string;
}
