import { DialogChoice } from "./vuex";

export interface DialogBoxParameters {
  title?: string;
  text: string;
  styleId?: string;
  choices?: DialogChoice[];
  old: boolean;
}
