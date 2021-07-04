import { ButtonsState } from "vue";
import { ButtonConfig } from "./config";
import { DataState, DialogKey, SkillCheckState, SkillsState } from "./vuex";

export interface GameSave {
  data: DataState;
  skills: SkillsState;
  dialog: DialogKey[];
  lastLabel: string;
  buttons: ButtonsState;
  skillChecks: {
    [key: string]: SkillCheckState;
  };
}
