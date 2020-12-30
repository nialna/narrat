import 'es6-promise/auto'
import './sass/main.css';
import { createApp } from 'vue';
import App from './app.vue';
import { store, key } from './store';
import './lib';
import { GameConfig } from './types/app-types';


export function startApp(config: GameConfig) {
  const app = createApp(App, {
    config,
  });
  app.mount('#app');
  app.use(store, key);
  // Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
  // Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
  if ((import.meta as any).hot) {
    (import.meta as any).hot.accept();
    (import.meta as any).hot.dispose(() => {
      // app.unmount();
    });
  }
}
