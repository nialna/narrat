<template>
  <div class="volume-controls">
    <input type="range" id="volume" name="volume" min="0" max="1" step="0.1" value="0.5"
    @change="changeVolume" />
    <button @click="toggleMute">Mute/Unmute</button>
  </div>
</template>
<script lang="ts">
import { Howler } from 'howler';
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  data () {
    return {
      muted: false,
    };
  },
  mounted() {
    Howler.volume(0.5);
  },
  methods: {
    changeVolume(event: Event) {
      console.log(event);
      const target = (event.target) as HTMLInputElement
      Howler.volume(target.value as any);
      console.log(target.value);
    },
    toggleMute() {
      if (this.muted) {
        Howler.mute(false);
        this.muted = false;
      } else {
        Howler.mute(true);
        this.muted = true;
      }
    }
  },
});
</script>
<style>

.volume-controls {
  position: fixed;
  top: 0;
  left: 0;
}
</style>