import { LogLevel } from '@chris.araneo/logger';
import { isString } from 'lodash';

export const isLogLevelOrThrow = (
  value: unknown,
): asserts value is LogLevel => {
  if (isString(value) && ['debug', 'info', 'warn', 'error'].includes(value)) {
    return;
  }

  throw new Error('Invalid log level');
};
