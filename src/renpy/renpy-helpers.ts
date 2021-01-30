import { State } from 'vue';

export function processSkillCheck(state: State, skillcheck: Parser.SkillCheckOptions): boolean {
  return runSkillCheck(state, {
    skill: skillcheck.skill,
    value: skillcheck.value,
    checkType: skillcheck.checkFunction,
  });
}

export interface SkillCheckParams {
  skill: string;
  value: number;
  checkType: string;
}
export function runSkillCheck(state: State, params: SkillCheckParams): boolean {
  let roll = Math.floor(Math.random() * 100);
  roll += state.skills[params.skill].level * 10;
  if (roll >= params.value) {
    return true;
  }
  return false;
}
export function runConditionCommand(state: State, command: Parser.Command): Parser.Branch | undefined {
  const options = (command.options as Parser.IfOptions);
  const result = runCondition(state, options.condition);
  console.log(result);
  if (result) {
    return options.success;
  } else if (!result && options.failure) {
    return options.failure;
  } else {
    return undefined;
  }
}

export function runCondition(state: State, condition: string): boolean {
  return conditionFunction(state, condition);
}

function conditionFunction(state: State, condition: string) {
  const context = {
    data: state.machine.data,
    skills: state.skills,
    skillCheck: (checkType: string, skill: string, value: number) => {
      return runSkillCheck(state, {
        skill,
        value,
        checkType,
      });
    },
  };
  return evalInContext(`(${condition})`, context) as boolean;
}

function evalInContext(script: string, context: any) {
  //# Return the results of the in-line anonymous function we .call with the passed context
  return function() { return eval(script); }.call(context);
}