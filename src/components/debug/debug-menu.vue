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
        <button @click="save">Save Game</button>
      </template>
    </modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Modal from '@/components/utils/modal.vue';

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