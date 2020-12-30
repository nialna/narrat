export interface Config {
  gameTitle: string;
  skills: {
    [key: string]: SkillData;
  };
  games: {
    [key: string]: string[];
  };
}

export interface SkillData {
  name: string;
  description: string;
}
