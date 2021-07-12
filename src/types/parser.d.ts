declare namespace Parser {
  type CommandType =
    | 'text'
    | 'jump'
    | 'choice'
    | 'set'
    | 'if'
    | 'talk'
    | 'set_screen'
    | 'set_button'
    | 'clear_dialog'
    | 'play'
    | 'wait';

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
    index: number;
  }

  interface PlayOptions {
    mode: 'sound' | 'music';
    audio: string;
  }

  interface SkillCheckOptions {
    id: string;
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

  interface WaitOptions {
    duration: number;
  }

  interface IfOptions {
    branch: Branch;
  }

  interface TextOptions {
    text: string;
  }

  interface SetScreenOption {
    screen: string;
  }
  interface EmptyOptions {}

  type CommandOptions =
    | IfOptions
    | JumpOptions
    | EmptyOptions
    | TextOptions
    | ChoiceOptions
    | SetScreenOption
    | PlayOptions
    | WaitOptions;

  interface Command {
    code: string;
    args: string[];
    operator: string;
    commandType: CommandType;
    options: CommandOptions;
  }

  type Branch = Command[];

  export interface ParsedScript {
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
