import { State } from "vue";
import { Store } from "vuex";

export function processText(store: Store<State>, text: string): string {
  return text.replace(/%{[^}]*}/g, (match) => {
    const key = match.substr(2, match.length - 3);
    return store.state.machine.data[key];
  });
}
