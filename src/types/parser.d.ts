declare namespace Parser {
  type CommandType = 'text' | 'jump' | 'choice' | 'set' | 'if' | 'talk';
  
  interface IfOptions {
    condition: string;
    success: Branch;
    failure?: Branch;
  }

  interface ChoiceOptions {
    prompt: Command;
    choices: ChoicePrompt[];
  }
  interface ChoicePrompt {
    choice: string;
    branch: Branch;
    condition?: string;
    skillCheck?: SkillCheckOptions;
  }

  interface SkillCheckOptions {
    checkFunction: string;
    skill: string;
    value: number;
    success: {
      text: string;
      branch: Branch;
    };
    failure: {
      text: string;
      branch?: Branch;
    };
  }

  interface JumpOptions {
    label: string;
  }
  
  interface IfOptions {
    branch: Branch;
  }
  
  interface TextOptions {
    text: string;
  }

  interface EmptyOptions {}

  type CommandOptions = IfOptions | JumpOptions | EmptyOptions | TextOptions | ChoiceOptions;
  
  interface Command {
    code: string;
    args: string[];
    operator: string;
    commandType: CommandType;
    options: CommandOptions;
  }
  
  type Branch = Command[];

  interface ParsedScript {
    [key: string]: Parser.Branch;
  }

  interface Line {
    code: string;
    indentation: number;
    line: number;
    operator: string;
    args: any[];
    branch?: Line[];
  }
}
