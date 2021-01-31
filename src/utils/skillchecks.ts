import { SkillCheckState } from "@/types/vuex";
import { State } from "vue";
import { ActionContext, Store } from "vuex";

export function createSkillCheckState(): SkillCheckState {
  const skillCheck = {
    passed: false,
    available: true,
  };
  return skillCheck;
}

export function getSkillCheckState(ctx: ActionContext<State, State>, skillCheckId: string): SkillCheckState {
  let skillCheck = ctx.state.skillChecks[skillCheckId];
  if (!skillCheck) {
    skillCheck = createSkillCheckState();
    ctx.commit('setupSkillCheck', {
      skillCheck,
      skillCheckId,
    });
  }
  return skillCheck;
}
