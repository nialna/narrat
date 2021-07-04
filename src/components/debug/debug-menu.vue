<template>
  <div class="debug-menu">
    <button @click="open" class="debug-button">Debug Menu</button>
    <modal v-if="showDebug" @close="close">
      <template v-slot:header>
        <h3>Debug Menu!</h3>
      </template>
      <template v-slot:body>
        Hello this is the debug menu.
        <select name="label-selector" @change="labelSelected($event)">
          <option selected disabled>Jump to a label</option>
          <option v-for="label in labels" :value="label" :key="label">{{ label }}</option>
        </select>
        <div class="grid grid-cols-3 gap-4">
          <button @click="wordCount">Word Count</button>
          <button @click="save">Save Game</button>
        </div>
      </template>
    </modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Modal from '../utils/modal.vue';

export default defineComponent({
  components: {
    Modal,
  },
  data () {
    return {
      showDebug: false,
    }
  },

  methods: {
    labelSelected(event: any) {
      const labelName = event.target.value;
      this.$store.dispatch('runLabel', labelName);
      this.close();
    },
    close() {
      this.showDebug = false;
    },
    open() {
      this.showDebug = true;
    },
    save() {
      this.$store.dispatch('saveGame');
    },
    wordCount() {
      const scripts = Object.values(this.$store.state.machine.script);
      const count = scripts.reduce((count, script) => {
        console.log(count)
        return count + this.countWordsInScriptBranch(script);
      }, 0)
      alert(`You have ${count} words`);
    },
    countWordsInScriptLine(scriptLine: Parser.Command): number {
      if (scriptLine.commandType === 'talk') {
        return this.countWordsInString(scriptLine.args[2]);
      }
      if (scriptLine.commandType === 'text') {
        return this.countWordsInString((scriptLine.options as Parser.TextOptions).text);
      }
      if (scriptLine.commandType === 'choice') {
        const opt = (scriptLine.options as Parser.ChoiceOptions);
        let count = this.countWordsInScriptLine(opt.prompt)
        count += opt.choices.reduce((count, choice) => count + this.countWordsInString(choice.choice), 0)
        const choices = opt.choices
        return choices.reduce((count, choice) => {
          return count + this.countWordsInScriptBranch(choice.branch)
        }, count)
      }
      if (scriptLine.commandType === 'if') {
        const opt = (scriptLine.options as Parser.IfOptions)
        const branches = [opt.success, opt.failure];
        return branches.reduce((count, choice) => {
          if (choice) {
            return count + this.countWordsInScriptBranch(choice);
          }
          return count;
        }, 0)
      }
      return 0;
    },
    countWordsInString(string: string): number {
      return string.split(' ').length;
    },
    countWordsInScriptBranch(branch: Parser.Branch): number {
      return branch.reduce((count, script) => {
        if (script) {
          return count + this.countWordsInScriptLine(script);
        }
        return count;
      }, 0)
    }
  },

  computed: {
    labels(): string[] {
      const scripts = this.$store.state.machine.script;
      return Object.keys(scripts).sort();
    }
  }
})
</script>

<style>

.debug-menu {
  z-index: 9999;
}

.debug-button {
  position: fixed;
  bottom: 10px;
  left: 10px;
}
</style>