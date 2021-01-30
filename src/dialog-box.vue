<template>
  <div class="dialog-box w-full" :style="dialogBoxStyle">
    <div class="dialog-content">
      <span class="dialog-title" v-if="options.title" :style="titleStyle">{{ options.title }}</span>
      <span class="dialog-text dialog-separator" :style="textStyle" v-html="preText"></span>
      <span class="dialog-text" :style="textStyle">{{ options.text }}</span>
      <div class="dialog-choices" v-if="canInteract && choices">
        <p v-for="(choice, index) in choices" :key="index"
        v-on:click="chooseOption(index)" class="dialog-choice">
          {{index + 1}}. –&nbsp; {{ choice.choice }}
        </p>
      </div>
      <div v-else-if="canInteract" class="buttons-container">
        <div v-on:click="chooseOption(0)" class="interact-button">Continue</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DialogStyle } from './types/character-types';
import { DialogBoxParameters } from './types/dialog-box-types'
import { DialogCallback, DialogChoice } from './types/vuex';
import { getCharacterStyle } from './utils/characters';

export default defineComponent({
  data () {
    return {
      passed: false,
    };
  },

  props: {
    options: Object as PropType<DialogBoxParameters>,
    active: Boolean,
  },

  computed: {
    preText(): string {
      if (this.options!.title) {
        return ' &nbsp;–&nbsp; ';
      } else {
        return '';
      }
    },
    style(): DialogStyle {
      return getCharacterStyle(this.options!.styleId);
    },
    dialogBoxStyle (): any {
      const style = getCharacterStyle(this.options!.styleId);
      let css: any = {
        opacity: this.options!.old ? '0.5' : '1',
      };
      if (!this.options!.title) {
        css.marginTop = '-20px';
      }
      return { ...style.boxCss, ...css };
    },
    titleStyle(): any {
      const style = getCharacterStyle(this.options!.styleId);
      const result = { color: style.color, ...style.nameCss };
      return result;
    },
    textStyle(): any {
      const style = getCharacterStyle(this.options!.styleId);
      return style.textCss;
    },
    choices (): DialogChoice[] | undefined {
      if (this.options!.choices) {
        return this.options!.choices;
      }
    },
    canInteract(): boolean {
      return this.active && !this.passed;
    }
  },

  methods: {
    chooseOption (index: number) {
      this.passed = true;
      this.$store.dispatch('playerAnswered', index);
    }
  }
})

</script>

<style>

.dialog-title {
  font-size: 18px;
  font-weight: bold;
}

.dialog-text {
  font-size: 14px;
}

.dialog-box {
  /* border-radius: 10px; */
  /* border: 1px solid #a8a8a8; */
  color: white;
  /* background-color: #2e2e2e; */
  padding: 10px;
  padding-left: 2em;
  margin-bottom: 10px;
  
}

.dialog-choice {
  color: orange;
}

.dialog-choice:hover {
  color: white;
  cursor: pointer;
}

.buttons-container {
  width: 100%;
  padding: 10px;
  display: flex;
  justify-content: space-evenly;
  align-items: stretch;
  box-sizing: border-box;
}


.interact-button {
  height: 50px;
  background-color: #72080f;
  color: white;
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
</style>