import { Config } from "@/types/config";
import {Howl} from 'howler';
import { State } from "vue";
import { ActionContext } from "vuex";

export const audio: {
  sound: {
    [key: string]: Howl;
  };
  music: {
    [key: string]: Howl;
  }
} = {
  sound: {},
  music: {},
};

export async function loadAudioAssets(config: Config): Promise<void[]> {
  console.log(`Loading audio`);
  const loadingPromises: Array<Promise<void>> = [];
  for (const key in config.sound) {
    const path = config.sound[key].path;
    loadingPromises.push(loadAudio(key, path, audio.sound));
  }
  for (const key in config.music) {
    const path = config.music[key].path;
    loadingPromises.push(loadAudio(key, path, audio.music));
  }
  return Promise.all(loadingPromises);
}

export async function loadAudio(key: string, path: string, dest: { [key: string]: Howl }): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Loading audio ${path}`);
    const sound = new Howl({
      src: [path],
    });
    sound.once('load', () => {
      console.log(`Loaded audio ${path}`);
      dest[key] = sound;
      resolve();
    });
    sound.load();
  });
}

export function changeMusic(ctx: ActionContext<State, State>, newMusic: string) {
  if (ctx.state.audio.currentMusic) {
    const oldMusic = getMusic(ctx.state.audio.currentMusic);
    if (oldMusic) {
      oldMusic.stop();
    }
  }
  ctx.commit('setMusic', newMusic);
  if (newMusic) {
    playMusic(newMusic);
  }
}

export function playMusic(key: string) {
  const music = getMusic(key);
  if (music) {
    music.play();
  } else {
    console.error(`Music ${key} not found!`);
  }
}

export function playSound(key: string) {
  const sound = getSound(key);
  if (sound) {
    sound.play();
  } else {
    console.error(`Sound effect ${key} not found!`);
  }
}

export function getMusic(key: string): Howl | undefined {
  return audio.music[key];
}
export function getSound(key: string): Howl | undefined {
  return audio.sound[key];
}