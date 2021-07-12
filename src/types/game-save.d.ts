import { ButtonsState } from 'vue';
import { DataState, DialogKey, SkillCheckState, SkillsState } from './vuex';

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
