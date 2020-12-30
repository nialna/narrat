
const INDENT_SIZE = 4;

export function processRenpyCommands(lines: Parser.Line[]): Parser.Branch {
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
          error(`Choice menu needs to have at least one option`, currentLine);
        }
        const prompt = line.branch![0];
        const choices = line.branch!.slice(1);
        const prompts: Parser.ChoicePrompt[] = choices.map(choice => {
          console.log(`Choice: `, choice);
          let choiceText = choice.operator;
          let condition: string | undefined;
          let skillCheck: Parser.SkillCheckOptions | undefined;
          if (choice.operator === 'skillcheck') {
            choiceText = choice.args[3];
            const successBranch = choice.branch![0];
            const failureBranch = choice.branch![1];
            const success = {
              text: successBranch.args[0],
              branch: processRenpyCommands(successBranch.branch!),
            };
            let failedBranch: Parser.Branch | undefined;
            if (failureBranch.branch) {
              failedBranch = processRenpyCommands(failureBranch.branch!);
            }
            const failure = {
              text: failureBranch.args[0],
              branch: failedBranch,
            };
            skillCheck = {
              checkFunction: choice.args[0],
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
            branch: processRenpyCommands(choice.branch!),
          };
        });
        command.options = {
          prompt: processRenpyCommands([prompt])[0],
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
        currentLine++;
        break;
      case 'if':
        command.commandType = 'if';
        let failure: Parser.Branch | undefined;
        const nextLine = getLine(lines, currentLine + 1);
        if (nextLine && nextLine.operator === 'else') {
          failure = processRenpyCommands(nextLine.branch!);
          currentLine++;
        }
        command.options = {
          condition: args[0],
          success: processRenpyCommands(line.branch!),
          failure,
        };
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

export function getLine(lines: Parser.Line[], index: number) {
  if (index < lines.length) return lines[index];
}

export function parseValue(value: string) {
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

export function parseCodeLine(codeToProcess: string) {
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

export function parseRenpyScript(code: string): Parser.ParsedScript {
  const lines = findRenpyLines(code);
  const script: Parser.ParsedScript = {}
  for (const line of lines) {
    const labelName = line.code.replace(':', '');
    script[labelName] = processRenpyCommands(line.branch!);
  }
  return script;
}

export function findRenpyLines(data: string): Parser.Line[] {
  const code = data.split('\n').map(line => {
    const commentIndex = line.search(/ *\/\//g);
    if (commentIndex !== -1) {
      return line.substr(0, commentIndex);
    }
    return line;
  }).filter(a => a.search(/^\s*$/) === -1);
  const lines = findRenpyBranches(code, 0, 0);
  return lines.lines;
};

export function findRenpyBranches(code: string[], startLine: number, indentLevel: number) {
  let stillInBranch = true;
let currentLine = startLine;
  const lines: Parser.Line[] = [];
  while (stillInBranch) {
    if (currentLine >= code.length) {
      break;
    }
    let lineText = code[currentLine];
    const lineIndent = getIndentLevel(lineText);
    lineText = lineText.substr(lineIndent * 4);
    validateIndent(lineIndent, currentLine);
    if (lineIndent < indentLevel) {
      stillInBranch = false;
    } else if (lineIndent > indentLevel) {
      if (lines.length === 0 || lineIndent - indentLevel !== 1) {
        error(`Wrong double indentation`, currentLine);
      }
      const branchLines = findRenpyBranches(code, currentLine, lineIndent);
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
  return {
    lines,
    endLine: currentLine,
  };
}


export function validateIndent(indentLevel: number, currentIndex: number) {
  if (indentLevel % 1 !== 0) {
    error(`Indentation level of ${indentLevel} incorrect`, currentIndex);
  }
}

export function getIndentLevel(line: string) {
  return line.search(/[^ ]/) / INDENT_SIZE;
}

export function error(text: string, line: number) {
  console.error(`Error line °${line}: ${text}`);
}
