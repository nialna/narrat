<template>
  <div class="dialog-picture override">
    <img :src="pictureUrl" class="picture override" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    pictureUrl: String
  },
})

</script>

<style>

.dialog-picture {
  position: absolute;
  width: 5em;
  height: 5em;
  bottom: 7em;
  left: -63px;
  border: 2px solid white;
  border-radius: 5px;
}

.dialog-picture img {
  width: 100%;
  height: 100%;
}
</style>