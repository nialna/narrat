import { CommandParsingContext, parserFunctions } from './command-parser-functions';

const INDENT_SIZE = 4;

export interface ParserContext {
  fileName: string;
  processCommandsFunction: (ctx: ParserContext, lines: Parser.Line[]) => Parser.Branch;
}
export function parseRenpyScript(code: string, fileName: string): Parser.ParsedScript {
  const ctx: ParserContext = {
    fileName,
    processCommandsFunction: processRenpyCommands,
  };
  const lines = findRenpyLines(ctx, code);
  const script: Parser.ParsedScript = {};
  for (const line of lines) {
    const labelName = line.code.replace(':', '');
    script[labelName] = processRenpyCommands(ctx, line.branch!);
  }
  return script;
}

function processRenpyCommands(ctx: ParserContext, lines: Parser.Line[]): Parser.Branch {
  const branchContext: Partial<CommandParsingContext> = {
    processCommandsFunction: processRenpyCommands,
    parserContext: ctx,
    lines,
    currentLine: 0,
  };
  const branch: Parser.Branch = [];
  while (branchContext.currentLine < lines.length) {
    const line = lines[branchContext.currentLine];
    const operator = line.operator;
    const args = line.args;
    const command: Partial<Parser.Command> = {
      code: line.code,
      operator,
      args,
    };
    branchContext.line = line;
    branchContext.command = command;
    let parseFunction = parserFunctions[operator];
    if (!parseFunction) {
      // default to text function
      parseFunction = parserFunctions.text;
    }
    parseFunction(branchContext as CommandParsingContext);
    branch.push(command as Parser.Command);
  }
  return branch;
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
  const ifIndex = codeToProcess.search(/\$if/g);
  // If we find a code block, everything after is code and won't be looked it
  // TODO: Generalise for other code operators
  if (ifIndex !== -1) {
    code = codeToProcess.substr(0, ifIndex);
    ifWords = ['if', codeToProcess.substr(ifIndex + 3)];
  }
  const regex = /(["'])(?:\\\1|.)*?\1/g;
  const matches = [];
  let match;
  while ((match = regex.exec(code)) != null) {
    matches.push(match);
  }
  let currentIndex = 0;
  let words: any[] = [];
  for (const match of matches) {
    const index = match.index;
    if (index > currentIndex) {
      const inBetween = code.substr(currentIndex, index - currentIndex);
      const newWords = inBetween.split(' ').filter((word) => word);
      words = [...words, ...newWords];
    }
    // Remove backticks for escaped quotes
    const finalMatch = match[0].replace(/\\/g, '');
    words.push(finalMatch);
    currentIndex = index + match[0].length;
  }
  const newWords = code
    .substr(currentIndex)
    .split(' ')
    .filter((code) => code);
  words = [...words, ...newWords, ...ifWords];
  words.forEach((word, index) => (words[index] = parseValue(word)));
  return words;
}

function findRenpyLines(ctx: ParserContext, data: string): Parser.Line[] {
  const code = data.split(/[\r\n]/).map((line) => {
    const commentIndex = line.search(/ *\/\//g);
    if (commentIndex !== -1) {
      return line.substr(0, commentIndex);
    }
    return line;
  });
  const lines = findRenpyBranches(ctx, code, 0, 0);
  return lines.lines;
}

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
    error(ctx, currentIndex, `Indentation level of ${indentLevel} incorrect`);
  }
}

function getIndentLevel(line: string) {
  return line.search(/[^ ]/) / INDENT_SIZE;
}

function error(ctx: ParserContext, line: number, text: string) {
  console.error(`Error in ${ctx.fileName}:${line}: ${text}`);
}
