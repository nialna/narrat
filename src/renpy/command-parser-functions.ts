import { ParserContext } from './renpy-parser';

export type CommandParserFunction = (ctx: CommandParsingContext) => void;
export type ProcessCommandsFunction = (ctx: ParserContext, lines: Parser.Line[]) => Parser.Branch;

export interface CommandParsingContext {
  parserContext: ParserContext;
  processCommandsFunction: ProcessCommandsFunction;
  line: Parser.Line;
  command: Partial<Parser.Command>;
  lines: Parser.Line[];
  currentLine: number;
}

function jump(ctx: CommandParsingContext) {
  ctx.command.commandType = 'jump';
  ctx.currentLine++;
}

function choice(ctx: CommandParsingContext) {
  const { line, command } = ctx;
  if (!line.branch! || line.branch!.length < 2) {
    error(ctx.parserContext, line.line, `Choice menu needs to have at least one option`);
  }
  const prompt = line.branch![0];
  const choices = line.branch!.slice(1);
  const prompts: Parser.ChoicePrompt[] = choices.map((choice, index) => parseChoiceOption(ctx, choice, index));
  command.options = {
    prompt: ctx.processCommandsFunction(ctx.parserContext, [prompt])[0],
    choices: prompts,
  };
  command.commandType = 'choice';
  ctx.currentLine++;
}

function set(ctx: CommandParsingContext) {
  ctx.command.commandType = 'set';
  ctx.currentLine++;
}

function talk(ctx: CommandParsingContext) {
  const { command, line } = ctx;
  command.commandType = 'talk';
  if (command.args.length < 3) {
    error(ctx.parserContext, line.line, `Talk command needs 3 arguments!`);
  }
  ctx.currentLine++;
}

function ifCommand(ctx: CommandParsingContext) {
  const { command, lines, currentLine, line } = ctx;
  command.commandType = 'if';
  let failure: Parser.Branch | undefined;
  const nextLine = getLine(lines, currentLine + 1);
  if (nextLine && nextLine.operator === 'else') {
    failure = ctx.processCommandsFunction(ctx.parserContext, nextLine.branch!);
    ctx.currentLine++;
  }
  command.options = {
    condition: command.args[0],
    success: ctx.processCommandsFunction(ctx.parserContext, line.branch!),
    failure,
  };
  ctx.currentLine++;
}

function setScreen(ctx: CommandParsingContext) {
  const { command } = ctx;
  command.commandType = 'set_screen';
  command.options = {
    screen: command.args[0],
  };
  ctx.currentLine++;
}

function setButton(ctx: CommandParsingContext) {
  const { command, line } = ctx;
  command.commandType = 'set_button';
  if (command.args.length !== 2) {
    error(ctx.parserContext, line.line, `set_button command should have 2 arguments`);
  }
  ctx.currentLine++;
}

function clearDialog(ctx: CommandParsingContext) {
  const { command } = ctx;
  command.commandType = 'clear_dialog';
  ctx.currentLine++;
}

function play(ctx: CommandParsingContext) {
  const { command } = ctx;
  command.commandType = 'play';
  command.options = {
    mode: command.args[0],
    audio: command.args[1],
  };
  ctx.currentLine++;
}

function wait(ctx: CommandParsingContext) {
  const { command } = ctx;
  command.commandType = 'wait';
  command.options = {
    duration: parseInt(command.args[0], 10),
  };
  ctx.currentLine++;
}

function text(ctx: CommandParsingContext) {
  const { command, line } = ctx;
  command.commandType = 'text';
  command.options = {
    text: line.operator,
  };
  ctx.currentLine++;
}
export const parserFunctions: { [key: string]: CommandParserFunction } = {
  jump,
  choice,
  set,
  talk,
  if: ifCommand,
  set_screen: setScreen,
  set_button: setButton,
  clear_dialog: clearDialog,
  play,
  wait,
  text,
};

function error(ctx: ParserContext, line: number, text: string) {
  console.error(`Error in ${ctx.fileName}:${line}: ${text}`);
}

function getLine(lines: Parser.Line[], index: number) {
  if (index < lines.length) return lines[index];
}

function parseChoiceOption(ctx: CommandParsingContext, choice: Parser.Line, index: number): Parser.ChoicePrompt {
  let choiceText = choice.operator;
  let condition: string | undefined;
  let skillCheck: Parser.SkillCheckOptions | undefined;
  if (choice.operator === 'skillcheck') {
    if (choice.args.length < 4) {
      error(ctx.parserContext, choice.line, `Skillchecks need 4 arguments!`);
    }
    choiceText = choice.args[3];
    const successBranch = choice.branch![0];
    const failureBranch = choice.branch![1];
    const success = {
      text: successBranch.args[0],
      branch: ctx.processCommandsFunction(ctx.parserContext, successBranch.branch!),
    };
    let failedBranch: Parser.Branch | undefined;
    if (failureBranch.branch) {
      failedBranch = ctx.processCommandsFunction(ctx.parserContext, failureBranch.branch!);
    }
    const failure = {
      text: failureBranch.args[0],
      branch: failedBranch,
    };
    skillCheck = {
      id: choice.args[0],
      skill: choice.args[1],
      value: choice.args[2],
      success,
      failure,
    };
  }
  if (choice.args[0] === 'if') {
    condition = choice.args[1];
  }
  return {
    choice: choiceText,
    condition,
    skillCheck,
    branch: ctx.processCommandsFunction(ctx.parserContext, choice.branch!),
    index,
  };
}
