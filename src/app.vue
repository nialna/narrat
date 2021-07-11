<template>
  <div id="app">
    <div class="background" :style="backgroundStyle" v-if="dialogPlaying">
      <canvas :width="gameWidth" :height="gameHeight" id="background-canvas" />
    </div>
    <div class="dialog override" :style="dialogStyle" v-if="dialogPlaying">
      <transition name="fade">
        <DialogPicture :pictureUrl="picture" v-if="picture" />
      </transition>
      <div class="dialog-container override ">
        <transition-group name="list" tag="div" class="w-full">
          <DialogBox v-for="(dialog, i) in dialog" :key="i"
            :options="getDialogBoxOptions(dialog, i)" :active="isDialogActive(i)"/>
        </transition-group>
      </div>
    </div>
    <div v-else-if="gameLoaded" class="flex flex-col">
      <button class="button menu-button start-button override" @click="startGame">Start Game</button>
      <button class="button menu-button continue-button override" @click="loadGame" v-if="saveFile">Continue Game</button>
    </div>
    <div v-else>
      <p>Loading... {{ config.charactersPath }}</p>
    </div>
    <DebugMenu v-if="options.debug" />
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
import { aspectRatioFit } from './utils/helpers';
import { loadImages } from './utils/images-loader';
import { debounce } from './utils/debounce';
import { AppOptions } from '.';

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
    options: Object as PropType<AppOptions>,
  },
  async mounted () {
    const charsFile = await getFile('data/characters.json')
    await setCharactersConfig(JSON.parse(charsFile));
    const configFile = await getFile('data/config.json');
    await setConfig(JSON.parse(configFile))
    await loadImages(getConfig());
    await this.startMachine();
    this.gameLoaded = true;
    window.addEventListener('resize', debounce(() => {
      this.updateScreenSize();
    }, 100, {
      maxWait: 200,
    }));
    this.updateScreenSize();
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
    },
    backgroundStyle(): any {
      return {
        width: `${this.backgroundSize.width}px`,
        height: `${this.backgroundSize.height}px`,
        top: `${this.backgroundSize.top}px`,
        left: `${this.backgroundSize.left}px`,
        backgroundColor: 'red',
        position: 'absolute',
      };
    },
    gameWidth(): number {
      return getConfig().layout.backgrounds.width;
    },
    gameHeight(): number {
      return getConfig().layout.backgrounds.height;
    },
    screenWidth(): number {
      return this.$store.state.rendering.screenWidth;
    },
    screenHeight(): number {
      return this.$store.state.rendering.screenHeight;
    },
    backgroundSize(): {width: number, height: number, left: number, top: number} {
      return {
        width: this.$store.state.rendering.canvasWidth,
        height: this.$store.state.rendering.canvasHeight,
        top: this.$store.state.rendering.topOffset,
        left: this.$store.state.rendering.leftOffset,
      };
    },
    dialogStyle(): any {
      return {
        position: 'absolute',
        backgroundColor: 'green',
        width: `${getConfig().layout.minTextWidth}px`,
        height: '100%',
        left: `${this.screenWidth - getConfig().layout.minTextWidth}px`,
        top: 0
      };
    },
  },

  methods: {
    async startMachine() {
      const scriptPaths = getConfig().scripts;
      return this.$store.dispatch('startMachine', { scriptPaths, config: getConfig() })
    },
    async startGame() {
      this.$store.commit('startPlaying');
      await this.$store.dispatch('runLine');
      this.dialogPlaying = true;
    },
    async loadGame() {
      this.$store.commit('startPlaying');
      await this.$store.dispatch('loadGame', this.saveFile);
      this.dialogPlaying = true;
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
    updateScreenSize() {
      this.$store.commit('updateScreenSize', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
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
        interactive: dialogKey.interactive,
      };
    },
  },
})
</script>

<style>

#app {
  background-color: black;
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
  height: 100%;
  /* padding: 20px; */
  background-color: #171717;
  overflow-y: scroll;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 200px;
}

.dialog {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  float: right;
  margin: 0;
}
.background {
  margin: 0;
}

#background-canvas {
  width: 100%;
  height: 100%;
}
</style>