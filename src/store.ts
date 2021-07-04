// store.ts
import { InjectionKey } from 'vue'
import { createLogger, createStore, Store } from 'vuex'
import { State } from 'vue';
import { nextLine, playerAnswered, runLine } from './vm/renpy-vm';
import { DialogCallback, DialogKey, MachineStack } from './types/vuex';
import { findDataHelper, setDataHelper } from './utils/data-helpers';
import { getFile } from './utils/ajax';
import { parseRenpyScript } from './renpy/renpy-parser';
import { ButtonConfig, Config, SkillData } from './types/config';
import { GameSave } from './types/game-save';
import { SAVE_FILE } from './constants';
import { AppOptions } from '.';
import { getConfig } from './config';
import { aspectRatioFit } from './utils/helpers';

// define your typings for the store state

export interface SetupStoreResult {
  store: Store<State>;
  key: InjectionKey<Store<State>>;
}

export function setupStore(options: AppOptions): SetupStoreResult {
  const plugins = [];

  // checking process.env actually exists just for safety
  if (options.logging) {
    plugins.push(createLogger());
  }
  // define injection key
  const key: InjectionKey<Store<State>> = Symbol()

  const store = createStore<State>({
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
      lastLabel: 'main',
      skillChecks: {},
      playing: false,
      currentScreen: 'default',
      buttons: {},
      rendering: {
        screenHeight: window.innerHeight,
        screenWidth: window.innerWidth,
        canvasWidth: window.innerWidth,
        canvasHeight: window.innerHeight,
        renderRatio: 1,
        topOffset: 0,
        leftOffset: 0,
      },
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
        for (const index in files) {
          const file = files[index]
          scripts = { ...scripts, ...parseRenpyScript(file, {
            fileName: scriptPaths[index],
          }) };
        }
        const end = Date.now();
        console.log(`script parsed in ${end - start} ms`);
        commit('setButtons', payload.config.buttons);
        commit('setScript', scripts);
        commit('setupSkills', payload.config.skills);
      },
      runLabel ({ state, commit }, label) {
        const branch = state.machine.script[label];
        if (!branch) {
          console.error(`Label ${branch} doesn't exist`);
        }
        commit('setLastLabel', label);
        state.machine.stack = [{
          currentIndex: 0,
          branch,
        }];
        this.dispatch('runLine');
      },
      async runLine (context) {
        await this.dispatch('saveGame')
        await runLine(context);
      },
      nextLine (context) {
        return nextLine(context);
      },
      playerAnswered(context, index) {
        return playerAnswered(context, index);
      },
      saveGame({ state }) {
        const save: GameSave = {
          data: state.machine.data,
          skills: state.skills,
          dialog: state.dialog,
          buttons: state.buttons,
          lastLabel: state.lastLabel,
          skillChecks: state.skillChecks,
        };
        localStorage.setItem(SAVE_FILE, JSON.stringify(save));
      },
      loadGame({ commit, dispatch }, saveFile: string) {
        if (saveFile) {
          const save: GameSave = JSON.parse(saveFile);
          commit('setLoadedData', save);
          dispatch('runLabel', save.lastLabel);
        }
      }
    },
    mutations: {
      setLoadedData (state, save: GameSave) {
        state.machine.data = save.data;
        state.skills = save.skills;
        state.dialog = save.dialog;
        state.buttons = save.buttons;
        state.lastLabel = save.lastLabel;
        state.skillChecks = save.skillChecks;
      },
      reset (state) {
        state.ready = false;
        state.machine.stack = [];
        state.machine.script = {};
        state.machine.data = {};
        state.dialog = [];
      },
      setLastLabel (state, label) {
        state.lastLabel = label;
      },
      setupSkillCheck (state, { skillCheck, skillCheckId }){
        state.skillChecks[skillCheckId] = skillCheck;
      },
      passSkillCheck(state, skillCheckId) {
        state.skillChecks[skillCheckId].passed = true;
      },
      failSkillCheck(state, skillCheckId) {
        state.skillChecks[skillCheckId].passed = false;
        state.skillChecks[skillCheckId].available = false;
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
      startPlaying (state) {
        state.playing = true;
      },
      setScreen (state, screen) {
        state.currentScreen = screen;
      },
      setButtons (state, buttons: { [key: string]: ButtonConfig }) {
        for (const i in buttons) {
          state.buttons[i] = {
            enabled: buttons[i].enabled,
          };
        }
      },
      changeButton (state, payload: { button: string, enabled: boolean }) {
        state.buttons[payload.button].enabled = payload.enabled;
      },
      updateScreenSize(state, { width, height }: {width: number, height: number}) {
        state.rendering.screenHeight = height;
        state.rendering.screenWidth = width;
        const config = getConfig().layout;
        const gameWidth = config.backgrounds.width;
        const gameHeight = config.backgrounds.height
        const screenWidth = width - config.minTextWidth;
        const screenHeight = height;
        const ratio = aspectRatioFit(screenWidth, screenHeight, gameWidth, gameHeight);
        state.rendering.renderRatio = ratio;
        const renderHeight = state.rendering.canvasHeight = gameHeight * ratio;
        const renderWidth = state.rendering.canvasWidth = gameWidth * ratio;
        state.rendering.topOffset = (screenHeight - renderHeight) / 2;
        state.rendering.leftOffset = (screenWidth - renderWidth) / 2;
      }
    },
    plugins,
  });
  return {
    store,
    key,
  };
}

function findDataKey(state: State, path: string) {
  return findDataHelper(state.machine.data, path);
}