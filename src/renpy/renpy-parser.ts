
const INDENT_SIZE = 4;

export interface ParserContext {
  fileName: string;
}
export function parseRenpyScript(code: string, ctx: ParserContext): Parser.ParsedScript {
  const lines = findRenpyLines(ctx, code);
  const script: Parser.ParsedScript = {}
  for (const line of lines) {
    const labelName = line.code.replace(':', '');
    script[labelName] = processRenpyCommands(ctx, line.branch!);
  }
  return script;
}

function processRenpyCommands(ctx: ParserContext, lines: Parser.Line[]): Parser.Branch {
  let currentLine = 0;
  const branch: Parser.Branch = [];
  while (currentLine < lines.length) {
    const line = lines[currentLine];
    const code = line.code;
    const operator = line.operator;
    const args = line.args;
    const command: Partial<Parser.Command> = {
      code: line.code,
      operator,
      args,
    };
    switch(operator) {
      case 'jump':
        command.commandType = 'jump';
        currentLine++;
        break;
      case 'choice':
        if (!line.branch! || line.branch!.length < 2) {
          error(ctx, line.line, `Choice menu needs to have at least one option`);
        }
        const prompt = line.branch![0];
        const choices = line.branch!.slice(1);
        const prompts: Parser.ChoicePrompt[] = choices.map((choice, index) => parseChoiceOption(ctx, choice, index));
        command.options = {
          prompt: processRenpyCommands(ctx, [prompt])[0],
          choices: prompts,
        };
        command.commandType = 'choice';
        currentLine++;
        break;
      case 'set':
        command.commandType = 'set';
        currentLine++;
        break;
      case 'talk':
        command.commandType = 'talk';
        if (command.args.length < 3) {
          error(ctx, line.line, `Talk command needs 3 arguments!`);
        }
        currentLine++;
        break;
      case 'if':
        command.commandType = 'if';
        let failure: Parser.Branch | undefined;
        const nextLine = getLine(lines, currentLine + 1);
        if (nextLine && nextLine.operator === 'else') {
          failure = processRenpyCommands(ctx, nextLine.branch!);
          currentLine++;
        }
        command.options = {
          condition: args[0],
          success: processRenpyCommands(ctx, line.branch!),
          failure,
        };
        currentLine++;
        break;
      case 'set_screen':
        command.commandType = 'set_screen';
        command.options = {
          screen: args[0],
        };
        currentLine++;
        break;
      case 'set_button':
        command.commandType = 'set_button';
        if (command.args.length !== 2) {
          error(ctx, line.line, `set_button command should have 2 arguments`);
        }
        currentLine++;
        break;
      default:
          command.commandType = 'text';
          command.options = {
            text: operator,
          }
          currentLine++;
      }
      branch.push(command as Parser.Command);
  }
  return branch;
}

function parseChoiceOption(ctx: ParserContext, choice: Parser.Line, index: number): Parser.ChoicePrompt {
  let choiceText = choice.operator;
  let condition: string | undefined;
  let skillCheck: Parser.SkillCheckOptions | undefined;
  if (choice.operator === 'skillcheck') {
    if (choice.args.length < 4) {
      error(ctx, choice.line, `Skillchecks need 4 arguments!`);
    }
    choiceText = choice.args[3];
    const successBranch = choice.branch![0];
    const failureBranch = choice.branch![1];
    const success = {
      text: successBranch.args[0],
      branch: processRenpyCommands(ctx, successBranch.branch!),
    };
    let failedBranch: Parser.Branch | undefined;
    if (failureBranch.branch) {
      failedBranch = processRenpyCommands(ctx, failureBranch.branch!);
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
    branch: processRenpyCommands(ctx, choice.branch!),
    index,
  };
}
function getLine(lines: Parser.Line[], index: number) {
  if (index < lines.length) return lines[index];
}

function parseValue(value: string) {
  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  } else if (!isNaN(Number(value))) {
    return Number(value);
  } else if (value.charAt(0) === '"') {
    return value.substr(1, value.length - 2);
  } else {
    return value;
  }
}

function parseCodeLine(codeToProcess: string) {
  if (codeToProcess.charAt(codeToProcess.length - 1) === ':') {
    codeToProcess = codeToProcess.substr(0, codeToProcess.length - 1);
  }
  let code = codeToProcess;
  let ifWords: string[] = [];
  let ifIndex = codeToProcess.search(/\$if/g);
  // If we find a code block, everything after is code and won't be looked it
  // TODO: Generalise for other code operators
  if (ifIndex !== -1) {
    code = codeToProcess.substr(0, ifIndex);
    ifWords = ['if', codeToProcess.substr(ifIndex + 3)];
  }
  const regex = /([\"'])(?:\\\1|.)*?\1/g;
  const matches = [];
  let match 
  while ((match = regex.exec(code)) != null) {
    matches.push(match);
  }
  let currentIndex = 0;
  let words: any[] = [];
  for (const match of matches) {
    const index = match.index;
    if (index > currentIndex) {
      const inBetween = code.substr(currentIndex, index - currentIndex);
      const newWords = inBetween.split(' ').filter(word => word);
      words = [...words, ...newWords];
    }
    // Remove backticks for escaped quotes
    let finalMatch = match[0].replace(/\\/g, '');
    words.push(finalMatch);
    currentIndex = index + match[0].length;
  }
  const newWords = code.substr(currentIndex).split(' ').filter(code => code);
  words = [...words, ...newWords, ...ifWords];
  words.forEach((word, index) => words[index] = parseValue(word));
  return words;
}



function findRenpyLines(ctx: ParserContext, data: string): Parser.Line[] {
  const code = data.split(/[\r\n]/).map(line => {
    const commentIndex = line.search(/ *\/\//g);
    if (commentIndex !== -1) {
      return line.substr(0, commentIndex);
    }
    return line;
  })
  const lines = findRenpyBranches(ctx, code, 0, 0);
  return lines.lines;
};

function findRenpyBranches(ctx: ParserContext, code: string[], startLine: number, indentLevel: number) {
  let stillInBranch = true;
let currentLine = startLine;
  const lines: Parser.Line[] = [];
  while (stillInBranch) {
    if (currentLine >= code.length) {
      break;
    }
    let lineText = code[currentLine];
    if (lineText.search(/^\s*$/) !== -1) {
      currentLine++;
    } else {
      const lineIndent = getIndentLevel(lineText);
      lineText = lineText.substr(lineIndent * 4);
      validateIndent(ctx, lineIndent, currentLine);
      if (lineIndent < indentLevel) {
        stillInBranch = false;
      } else if (lineIndent > indentLevel) {
        if (lines.length === 0 || lineIndent - indentLevel !== 1) {
          error(ctx, currentLine, `Wrong double indentation`);
        }
        const branchLines = findRenpyBranches(ctx, code, currentLine, lineIndent);
        lines[lines.length - 1].branch = branchLines.lines;
        currentLine = branchLines.endLine;
      } else {
        const words = parseCodeLine(lineText);
        const line: Parser.Line = {
          code: lineText,
          indentation: lineIndent,
          line: currentLine,
          operator: words[0],
          args: words.slice(1),
        };
        lines.push(line);
        currentLine++;
      }
    }
  }
  return {
    lines,
    endLine: currentLine,
  };
}


function validateIndent(ctx: ParserContext, indentLevel: number, currentIndex: number) {
  if (indentLevel % 1 !== 0) {
    error(ctx, currentIndex,`Indentation level of ${indentLevel} incorrect`);
  }
}

function getIndentLevel(line: string) {
  return line.search(/[^ ]/) / INDENT_SIZE;
}

function error(ctx: ParserContext, line: number, text: string) {
  console.error(`Error in ${ctx.fileName}:${line}: ${text}`);
}
