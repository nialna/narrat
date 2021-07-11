import { ActionContext, Commit } from 'vuex';
import { State } from 'vue';
import { timeout } from '@/utils/promises';
import { DialogCallback, DialogKey, DialogChoice, MachineStack } from '@/types/vuex';
import { processSkillCheck, runCondition, runConditionCommand, runSkillCheck } from '@/renpy/renpy-helpers';
import { getConfig } from '@/config';
import { getSkillCheckState } from '@/utils/skillchecks';
import { audio, changeMusic, playSound } from '@/utils/audio-loader';

export async function runLine(context: ActionContext<State, State>) {
  const cmd = context.getters.currentLine as Parser.Command;
  await runCommand(context, cmd);
}

export async function runCommand(context: ActionContext<State, State>,
  cmd: Parser.Command, choices?: DialogChoice[]) {
  const { state, commit, dispatch } = context;
  switch(cmd.commandType) {
    case 'jump':
      const branch = cmd.args[0];
      const newStack: MachineStack = {
        branch: state.machine.script[branch],
        currentIndex: 0,
      };
      commit('setStack', newStack);
      await dispatch('runLine');
      break;
    case 'text':
      await textCommand(commit, {
        speaker: 'game',
        text: (cmd.options as Parser.TextOptions).text,
        choices,
        interactive: true,
      });
      break;
    case 'set':
      const key = cmd.args[0];
      const value = cmd.args[1];
      commit('setData', { path: key, value });
      return dispatch('nextLine');
    case 'if':
      const newBranch = runConditionCommand(context, cmd);
      if (newBranch) {
        const newStack: MachineStack = {
          branch: newBranch,
          currentIndex: 0,
        };
        commit('addStack', newStack);
        return dispatch('runLine');
      }
      return dispatch('nextLine');
    case 'talk':
      const pose = cmd.args[1];
      await textCommand(commit, {
        speaker: cmd.args[0],
        pose: cmd.args[1],
        text: `"${cmd.args[2]}"`,
        choices,
        interactive: true,
      });
      break;
    case 'choice':
      await runChoice(context, cmd);
      break;
    case 'set_screen':
      commit('setScreen', (cmd.options as Parser.SetScreenOption).screen);
      return dispatch('nextLine');
    case 'clear_dialog':
      commit('clearDialog');
      return dispatch('nextLine');
    case 'set_button':
      console.log(cmd.args);
      commit('changeButton', {
        button: cmd.args[0],
        enabled: cmd.args[1],
      });
      return dispatch('nextLine');
    case 'play':
      const options = cmd.options as Parser.PlayOptions;
      if (options.mode === 'music') {
        changeMusic(context, options.audio);
      } else {
        playSound(options.audio);
      }
      return dispatch('nextLine');
    case 'wait':
      await timeout((cmd.options as Parser.WaitOptions).duration);
      return dispatch('nextLine');
    default:
      break;
  }
}

export async function playerAnswered (context: ActionContext<State, State>, choiceIndex: number) {
  const { commit, dispatch, state } = context;
  const cmd = context.getters.currentLine as Parser.Command;
  
  switch(cmd.commandType) {
    case 'choice':
      const options = (cmd.options as Parser.ChoiceOptions);
      const choice = options.choices[choiceIndex];
      let playerText = choice.choice;
      let newBranch: Parser.Branch | undefined;
      const skillcheck = choice.skillCheck;
      if (skillcheck) {
        const skillCheckState = getSkillCheckState(context, choice.skillCheck.id);
        if (skillCheckState.passed) {
          newBranch = skillcheck.success.branch;
          playerText = skillcheck.success.text;
        } else {
          const result = processSkillCheck(context, skillcheck);
          const winner = result ? skillcheck.success : skillcheck.failure;
          newBranch = winner.branch;
          playerText = `[${result ? 'SUCCESS' : 'FAILURE'}] – ${winner.text}`;
        }
      } else {
        newBranch = choice.branch;
      }
      const dialog: DialogKey = {
        speaker: 'player',
        text: playerText,
        interactive: true,
      };
      commit('addDialog', { dialog });
      if (newBranch) {
        const newStack: MachineStack = {
          currentIndex: 0,
          branch: newBranch,
        };
        commit('addStack', newStack);
        dispatch('runLine');
      } else {
        dispatch('nextLine');
      }
      break;
    default:
      dispatch('nextLine');
  }
}

export async function runChoice(context: ActionContext<State, State>, cmd: Parser.Command) {
  const { commit, state } = context;
  const options = (cmd.options as Parser.ChoiceOptions);
  const prompt = options.prompt;
  const choices = options.choices.filter(choice => {
    // Delete the choice if it fails a condition
    if (choice.condition) {
      return runCondition(context, choice.condition);
    }
    return true;
  }).map(choice => {
    let text = choice.choice;
    let choiceAllowed = true;
    if (choice.skillCheck) {
      const config = getConfig();
      const skill = config.skills[choice.skillCheck.skill];
      const skillCheckState = getSkillCheckState(context, choice.skillCheck.id);
      if (!skillCheckState.available) {
        choiceAllowed = false;
        text = `[${skill.name} - Failed] ${text}`;
      } else if (!skillCheckState.passed) {
        text = `[${skill.name} - Medium] ${text}`;
      }
    }
    const result: DialogChoice = {
      choice: text,
      originalIndex: choice.index,
      allowed: choiceAllowed,
    };
    return result;
  });
  runCommand(context, prompt, choices);
}

export async function textCommand(commit: Commit, dialog: DialogKey) {
  commit('addDialog', {
    dialog,
  });
}

export async function nextLine({ state, getters, dispatch, commit }: ActionContext<State, State>) {
  if (state.machine.stack.length === 0) {
    finishGame(commit);
    return;
  }

  const machineHead = getters.machineHead as MachineStack;
  if (machineHead.currentIndex < machineHead.branch.length - 1) {
    commit('nextLine');
  } else {
    // This branch is finished, go back to previous stack
    commit('previousStack');
    return dispatch('nextLine');
  }
  if (state.machine.stack.length === 0) {
    finishGame(commit);
  } else {
    return dispatch('runLine');
  }
}

export function finishGame(commit: Commit) {
  commit('addDialog', {
    dialog: {
      speaker: 'game',
      text: 'The game script has finished',
    }
  });
}