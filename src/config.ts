import { Config } from "./types/config";

let config!: Config;

export function setConfig(conf: Config) {
  config = conf;
}

export function getConfig() {
  return config;
}
