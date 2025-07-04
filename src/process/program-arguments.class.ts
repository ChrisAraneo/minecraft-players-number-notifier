import { first, isEmpty, isString } from 'lodash';

import { hasMoreThanOneItem } from '../utils/has-more-than-one-item.function';
import { second } from '../utils/second.function';
import { sliceTwo } from '../utils/slice-two.function';
import { Argument } from './argument.interface';
import { ArgumentKey } from './argument-key.type';
import { DISCORD_TOKEN, RECIPIENTS } from './argument-keys.consts';
import { Process } from './process.class';
import {
  INCORRECT_ARGUMENT_KEY_ERROR_MESSAGE,
  INCORRECT_ARGUMENT_VALUE_ERROR_MESSAGE,
} from './program-arguments.consts';

export class ProgramArguments {
  private readonly arguments: string[];

  constructor(private readonly process: Process) {
    this.arguments = sliceTwo([...this.process.argv]);
  }

  load(): Argument[] {
    return this.arguments.map((argument) => {
      const argumentParts = argument.split('=');

      this.partsNotEmptyOrThrow(argumentParts);

      const key = first(argumentParts);
      const value = second(argumentParts);

      this.argumentKeyIsValidOrThrow(key);
      this.valueIsStringOrThrow(value);

      const valueParts = value.split(';');

      return {
        key,
        value: hasMoreThanOneItem(valueParts) ? valueParts : first(valueParts),
      };
    });
  }

  private argumentKeyIsValidOrThrow(
    key: string | undefined,
  ): asserts key is ArgumentKey {
    if (key !== DISCORD_TOKEN && key !== RECIPIENTS) {
      throw new Error(INCORRECT_ARGUMENT_KEY_ERROR_MESSAGE);
    }
  }

  private partsNotEmptyOrThrow(
    parts: string[],
  ): asserts parts is [string, ...string[]] {
    if (isEmpty(parts)) {
      throw new Error(INCORRECT_ARGUMENT_VALUE_ERROR_MESSAGE);
    }
  }

  private valueIsStringOrThrow(
    value: string | undefined,
  ): asserts value is string {
    if (!isString(value)) {
      throw new Error(INCORRECT_ARGUMENT_VALUE_ERROR_MESSAGE);
    }
  }
}
