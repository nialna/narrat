// store.ts
import { InjectionKey } from 'vue'
import { createLogger, createStore, Store } from 'vuex'
import { State } from 'vue';
import { nextLine, playerAnswered, runLine } from './vm/renpy-vm';
import { DialogCallback, DialogKey, MachineStack } from './types/vuex';
import { findDataHelper, setDataHelper } from './utils/data-helpers';
import { getFile } from './utils/ajax';
import { parseRenpyScript } from './renpy/renpy-parser';
import { Config, SkillData } from './types/config';

// define your typings for the store state


const plugins = [];
// checking process.env actually exists just for safety
if (process && typeof process.env === 'object') {
  if (process.env.NODE_ENV !== 'production') {
    plugins.push(createLogger());
  }
}
// define injection key
export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state: {
    machine: {
      stack: [],
      script: {},
      data: {
        playerName: 'Player',
      },
    },
    dialog: [],
    ready: false,
    count: 0,
    skills: {},
  },
  getters: {
    machineHead (state): MachineStack {
      return state.machine.stack[state.machine.stack.length - 1];
    },
    currentLine (state, getters): Parser.Command {
      const machineHead = getters.machineHead;
      return machineHead.branch[machineHead.currentIndex];
    },
    command (state, getters): Parser.Command {
      const machineHead = getters.machineHead;
      return machineHead.branch[machineHead.currentIndex];
    },
  },
  actions: {
    async startMachine ({ commit }, payload: { scriptPaths: string[], config: Config }) {
      const { scriptPaths, config } = payload;
      const filePromises: Array<Promise<string>> = [];
      for (const path of scriptPaths) {
        filePromises.push(getFile(path));
      }
      const files = await Promise.all(filePromises);
      const start = Date.now();
      let scripts: Parser.ParsedScript = {};
      for (const file of files) {
        scripts = { ...scripts, ...parseRenpyScript(file) };
      }
      const end = Date.now();
      console.log(`script parsed in ${end - start} ms`);
      commit('setScript', scripts);
      commit('setupSkills', payload.config.skills);
      this.dispatch('runLine');
    },
    runLine (context) {
      return runLine(context);
    },
    nextLine (context) {
      return nextLine(context);
    },
    playerAnswered(context, index) {
      return playerAnswered(context, index);
    },
  },
  mutations: {
    reset (state) {
      state.ready = false;
      state.machine.stack = [];
      state.machine.script = {};
      state.machine.data = {};
      state.dialog = [];
    },
    setScript (state, script) {
      state.machine.script = script;
      state.machine.stack.push({
        currentIndex: 0,
        branch: script.main,
      });
      state.ready = true;
    },
    setupSkills (state, skills: { [key: string]: SkillData }) {
      for (const skill in skills) {
        state.skills[skill] = {
          level: 1,
        };
      }
    },
    incrementSkill (state, { skill, amount }: { skill: string, amount: number }) {
      state.skills[skill].level += amount;
    },
    addDialog (state, payload: { dialog: DialogKey }) {
      state.dialog.push(payload.dialog);
    },
    nextLine (state) {
      state.machine.stack[state.machine.stack.length - 1].currentIndex += 1;
    },
    previousStack (state) {
      state.machine.stack.splice(state.machine.stack.length - 1);
    },
    addStack (state, newStack) {
      state.machine.stack.push(newStack);
    },
    setStack (state, newStack) {
      state.machine.stack = [];
      state.machine.stack.push(newStack);
    },
    setData (state, { path, value }: { path: string, value: any }) {
      setDataHelper(state.machine.data, path, value);
    },
  },
  plugins,
})

function findDataKey(state: State, path: string) {
  return findDataHelper(state.machine.data, path);
}
