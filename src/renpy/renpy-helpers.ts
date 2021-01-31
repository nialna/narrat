import { getSkillCheckState } from '@/utils/skillchecks';
import { State } from 'vue';
import { ActionContext } from 'vuex';

export function processSkillCheck(ctx: ActionContext<State, State>, skillcheck: Parser.SkillCheckOptions): boolean {
  return runSkillCheck(ctx, {
    skill: skillcheck.skill,
    value: skillcheck.value,
    id: skillcheck.id,
  });
}

export interface SkillCheckParams {
  skill: string;
  value: number;
  id: string;
}
export function runSkillCheck(ctx: ActionContext<State, State>, params: SkillCheckParams): boolean {
  const { state } = ctx;
  let roll = Math.floor(Math.random() * 100);
  roll += state.skills[params.skill].level * 10;
  if (roll >= params.value) {
    ctx.commit('passSkillCheck', params.id);
    return true;
  }
  ctx.commit('failSkillCheck', params.id);
  return false;
}
export function runConditionCommand(ctx: ActionContext<State, State>, command: Parser.Command): Parser.Branch | undefined {
  const options = (command.options as Parser.IfOptions);
  const result = runCondition(ctx, options.condition);
  console.log(result);
  if (result) {
    return options.success;
  } else if (!result && options.failure) {
    return options.failure;
  } else {
    return undefined;
  }
}

export function runCondition(ctx: ActionContext<State, State>, condition: string): boolean {
  return conditionFunction(ctx, condition);
}

function conditionFunction(ctx: ActionContext<State, State>, condition: string) {
  const { state } = ctx;
  const context = {
    data: state.machine.data,
    skills: state.skills,
    skillCheck: (checkId: string, skill: string, value: number) => {
      const skillCheckState = getSkillCheckState(ctx, checkId);
      if (skillCheckState) {
        if (skillCheckState.passed) {
          return true ;
        } else if (!skillCheckState.available) {
          return false;
        }
      }
      return runSkillCheck(ctx, {
        skill,
        value,
        id: checkId,
      });
    },
  };
  return evalInContext(`(${condition})`, context) as boolean;
}

function evalInContext(script: string, context: any) {
  //# Return the results of the in-line anonymous function we .call with the passed context
  return function() { return eval(script); }.call(context);
}