// vuex.d.ts
import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex';

export type DialogCallback = (choice: number) => void;

export interface MachineStack {
  currentIndex: number;
  branch: Parser.Branch;
}

export interface DialogKey {
  speaker: string;
  text: string;
  pose?: string;
  choices?: DialogChoice[];
}

export interface DialogChoice {
  choice: string;
  originalIndex: number;
}

export interface SkillState {
  level: number;
}

export interface SkillsState {
  [key: string]: SkillState;
}

export interface DataState {
  [key: string]: any;
}

declare module '@vue/runtime-core' {

  // declare your own store states
  interface State {
    machine: {
      stack: MachineStack[];
      script: Parser.ParsedScript;
      data: DataState;
    };
    dialog: DialogKey[];
    count: number;
    ready: boolean;
    skills: SkillsState;
    lastLabel: string;
  }
  

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>
  }
}