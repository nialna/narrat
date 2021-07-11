export interface Config {
  gameTitle: string;
  images: {
    [key: string]: string;
  };
  layout: {
    backgrounds: {
      width: number;
      height: number;
    };
    minTextWidth: number;
    maxTextHeight: number;
  };
  screens: {
    [key: string]: {
      background: string;
      buttons: string[];
    };
  };
  buttons: {
    [key: string]: ButtonConfig;
  };
  skills: {
    [key: string]: SkillData;
  };
  scripts: string[];
  sound: {
    [key: string]: SoundConfig;
  };
  music: {
    [key: string]: MusicConfig;
  };
}

export interface SoundConfig {
  path: string;
  volume: number;
  rate: number;
}

export interface MusicConfig extends SoundConfig {
  loop?: boolean;
}
export interface ButtonConfig {
  enabled: boolean;
  background: string;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  action: string;
}
export interface SkillData {
  name: string;
  description: string;
}
