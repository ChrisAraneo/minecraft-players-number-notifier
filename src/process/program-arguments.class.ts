import { isEmpty } from 'lodash';

import { Argument } from './argument.interface';
import { ArgumentKey } from './argument-key.type';
import { DISCORD_TOKEN, RECIPIENTS } from './argument-keys.consts';
import { Process } from './process.class';
import {
  INCORRECT_ARGUMENT_KEY_ERROR_MESSAGE,
  INCORRECT_ARGUMENT_VALUE_ERROR_MESSAGE,
} from './program-arguments.consts';

export class ProgramArguments {
  private arguments?: string[];

  constructor(private readonly process: Process) {
    this.initialize();
  }

  load(): Argument[] {
    return (this.arguments ?? []).map((argument) => {
      const parts = argument.split('=');

      if (!isEmpty(parts.length)) {
        const key: string = parts[0];

        if (!this.isArgumentKeyValid(key)) {
          throw new Error(INCORRECT_ARGUMENT_KEY_ERROR_MESSAGE);
        }

        const valueParts = parts[1].split(';');

        return {
          key,
          value: valueParts.length > 1 ? valueParts : valueParts[0],
        };
      }
      throw new Error(INCORRECT_ARGUMENT_VALUE_ERROR_MESSAGE);
    });
  }

  private initialize(): void {
    if (!this.arguments) {
      const { argv } = this.process;
      const { length } = argv;

      this.arguments = argv.slice(2, length);
    }
  }

  private isArgumentKeyValid(key: string): key is ArgumentKey {
    return key === DISCORD_TOKEN || key === RECIPIENTS;
  }
}
