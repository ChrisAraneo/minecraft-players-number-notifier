import { ArgumentKey } from './argument-key.type';

export interface Argument {
  key: ArgumentKey;
  value: string | string[] | undefined;
}
