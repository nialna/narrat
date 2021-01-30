export interface Config {
  gameTitle: string;
  skills: {
    [key: string]: SkillData;
  };
  scripts: string[];
}

export interface SkillData {
  name: string;
  description: string;
}
