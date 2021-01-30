<template>
  <div id="app">
    <div class="dialog" v-if="dialogPlaying">
      <transition name="fade">
        <DialogPicture :pictureUrl="picture" v-if="picture" />
      </transition>
      <div class="dialog-container">
        <transition-group name="list" tag="div" class="w-full">
          <DialogBox v-for="(dialog, i) in dialog" :key="i"
            :options="getDialogBoxOptions(dialog, i)" :active="isDialogActive(i)"/>
        </transition-group>
      </div>
    </div>
    <div v-else-if="gameLoaded" class="flex flex-col">
      <button class="button" @click="startGame">Start Game</button>
      <button class="button" @click="loadGame" v-if="saveFile">Continue Game</button>
    </div>
    <div v-else>
      <p>Loading... {{ config.charactersPath }}</p>
    </div>
    <DebugMenu />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import DialogBox from './dialog-box.vue';
import DialogPicture from './components/dialog-picture.vue';
import DebugMenu from './components/debug/debug-menu.vue';
import { getFile } from './utils/ajax';
import { getCharacterInfo, getCharacterPictureUrl, setCharactersConfig } from '@/utils/characters';
import { DialogKey } from './types/vuex';
import { DialogBoxParameters } from './types/dialog-box-types';
import { processText } from './utils/string-helpers';
import { getConfig, setConfig } from './config';
import { GameConfig } from './types/app-types';
import { SAVE_FILE } from './constants';
console.log('hello app');

export default defineComponent({
  components: {
    DialogBox,
    DialogPicture,
    DebugMenu,
  },

  data () {
    return {
      lineTitle: 'title',
      lineText: 'hello',
      gameLoaded: false,
      dialogPlaying: false,
    };
  },
  props: {
    config: Object as PropType<GameConfig>,
  },
  async mounted () {
    const charsFile = await getFile('data/characters.json')
    await setCharactersConfig(JSON.parse(charsFile));
    const configFile = await getFile('data/config.json');
    await setConfig(JSON.parse(configFile))
    await this.startMachine();
    this.gameLoaded = true;
  },

  computed: {
    dialog(): DialogKey[] {
      return this.$store.state.dialog;
    },
    lastDialog(): DialogKey | undefined {
      if (this.dialog.length > 0) {
        return this.dialog[this.dialog.length - 1];
      }
    },
    command(): Parser.Command {
      return this.$store.getters.command;
    },
    picture(): string | undefined {
      if (this.lastDialog) {
        return getCharacterPictureUrl(this.lastDialog.speaker, this.lastDialog.pose);
      }
    },
    saveFile(): string | null {
      const saveString: string | null = localStorage.getItem(SAVE_FILE);
      return saveString;
    }
  },

  methods: {
    async startMachine() {
      const scriptPaths = getConfig().scripts;
      return this.$store.dispatch('startMachine', { scriptPaths, config: getConfig() })
    },
    async startGame() {
      await this.$store.dispatch('runLine');
      this.dialogPlaying = true;
    },
    async loadGame() {
      await this.$store.dispatch('loadGame', this.saveFile);
      this.dialogPlaying = true;
    },
    scriptSelected(event: any) {
      const gameName = event.target.value;
      const scriptPaths = getConfig().scripts;
      this.$store.dispatch('startMachine', { scriptPaths, config: getConfig() })
      .then(() => {
        this.dialogPlaying = true;
      });
    },
    isDialogActive(i: number) {
      const result = (i === this.dialog.length - 1) && (this.$store.state.machine.stack.length > 0);
      return result;
    },
    nextLine () {
      this.$store.dispatch('nextLine');
    },
    choosePrompt (index: number) {
      this.$store.dispatch('choosePrompt', index);
    },
    getDialogBoxOptions (dialogKey: DialogKey, index: number): DialogBoxParameters {
      const info = getCharacterInfo(dialogKey.speaker);
      let title: string | undefined = info.name;
      if (index >= 1) {
        const previousDialog = this.dialog[index - 1];
        if (previousDialog.speaker === dialogKey.speaker) {
          title = undefined;
        }
      }
      return {
        title,
        text: processText(this.$store, dialogKey.text),
        styleId: dialogKey.speaker,
        choices: dialogKey.choices,
        old: (index < this.dialog.length - 1),
      };
    },
  },
})
</script>

<style>

#app {
  background-color: black;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
}

.interact-button {
  height: 50px;
  background-color: #72080f;
  border: 1px solid black;
  font-weight: bold;
  font-size: 20px;
  text-align: center;
  flex-grow: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.interact-button:not(:last-child) {
  margin-right: 10px;
}

.dialog-container {
  flex-grow: 2;
  margin-left: 85px;
  height: 100%;
  /* padding: 20px; */
  background-color: #171717;
  overflow-y: scroll;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.dialog {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  float: right;
}
</style>