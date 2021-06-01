import 'es6-promise/auto'
import './/sass/main.css';
import { App, createApp, State } from 'vue';
import GameApp from './app.vue';
import { setupStore } from './store';
import './lib';
import { GameConfig } from './types/app-types';
import { images } from './utils/images-loader';
import { Store } from 'vuex';
import { getConfig } from './config';

export interface AppOptions {
  debug: boolean;
}

let app: any;
let store: Store<State>;
export function startApp(config: GameConfig, options: AppOptions) {
  console.log('%c Narrat game engine – [VI]{version} - {date}[/VI]', 'background: #222; color: #bada55');
  app = createApp(GameApp, {
    config,
  });
  app.mount('#app');
  const storeSetup = setupStore(options);
  store = storeSetup.store;
  app.use(store, storeSetup.key);
  // Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
  // Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
  if ((import.meta as any).hot) {
    (import.meta as any).hot.accept();
    (import.meta as any).hot.dispose(() => {
      // app.unmount();
    });
  }
  gameLoop();
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
function gameLoop() {
  if (store.state.playing) {
    if (!canvas) {
      canvas = document.querySelector('#background-canvas') as HTMLCanvasElement;
      if (canvas && !ctx) {
        ctx = canvas.getContext('2d');
      }
    } else {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const currentScreen = store.state.currentScreen;
      const bg = getConfig().screens[currentScreen].background;
      ctx.drawImage(images[bg], 0, 0);
    }
  }
  window.requestAnimationFrame(gameLoop);
}