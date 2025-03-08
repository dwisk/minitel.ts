import { MinitelTSState } from "./state.ts";

export type MinitelTSRoute = {
  path: string;
  loop: Function;
  state: MinitelTSStateType;
};

export type MinitelTSColor = {
  noir: number;
  rouge: number;
  vert: number;
  jaune: number;
  bleu: number;
  magenta: number;
  cyan: number;
  blanc: number;
};

export type MinitelTSStateType = ReturnType<typeof MinitelTSState>;