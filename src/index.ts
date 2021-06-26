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
import { aabb, screenToCanvas } from './utils/helpers';
import { parseRenpyScript } from './renpy/renpy-parser';
import { MachineStack } from './types/vuex';
import { debounce } from './utils/debounce';

export interface AppOptions {
  debug: boolean;
}

let app: any;
let store: Store<State>;
let mousePos = {
  x: 0,
  y: 0,
};
export function startApp(config: GameConfig, options: AppOptions) {
  document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  });
  document.addEventListener('click', debounce(mouseclick, 100, { maxWait: 200, isImmediate: true }));
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
      const screen = getConfig().screens[currentScreen];
      const bg = screen.background;
      ctx.drawImage(images[bg], 0, 0);
      let foundCollision = false;
      const scaledMousePos = screenToCanvas(mousePos.x, mousePos.y, store.state.rendering);
      if (screen.buttons) {
        for (const buttonName of screen.buttons) {
          const button = getConfig().buttons[buttonName];
          const image = images[button.background];
          ctx.drawImage(image, button.position.left, button.position.top);
          if (aabb(scaledMousePos.x, scaledMousePos.y, 1, 1, button.position.left, button.position.top, button.position.width, button.position.height)) {
            foundCollision = true;
          }
        }
      }
      if (foundCollision) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
      ctx.fillStyle = 'black';
      ctx.textAlign = 'left';
      ctx.fillText(`x: ${scaledMousePos.x}, y: ${scaledMousePos.y}`, 0, 20);
    }
  }
  window.requestAnimationFrame(gameLoop);
}

function mouseclick(e: MouseEvent) {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
  const scaledMousePos = screenToCanvas(mousePos.x, mousePos.y, store.state.rendering);
  const currentScreen = store.state.currentScreen;
  const screen = getConfig().screens[currentScreen];
  if (screen.buttons) {
    for (const buttonName of screen.buttons) {
      const button = getConfig().buttons[buttonName];
      if (aabb(scaledMousePos.x, scaledMousePos.y, 1, 1, button.position.left, button.position.top, button.position.width, button.position.height)) {
        // clicked button
        const scriptToRun = button.action;
        const newStack: MachineStack = {
          branch: store.state.machine.script[scriptToRun],
          currentIndex: 0,
        };
        store.commit('setStack', newStack);
        store.dispatch('runLine');
      }
    }
  }
}