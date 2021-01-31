import { DataState, DialogKey, SkillCheckState, SkillsState } from "./vuex";

export interface GameSave {
  data: DataState;
  skills: SkillsState;
  dialog: DialogKey[];
  lastLabel: string;
  skillChecks: {
    [key: string]: SkillCheckState;
  };
}
