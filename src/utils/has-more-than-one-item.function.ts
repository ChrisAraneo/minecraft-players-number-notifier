/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { isArray } from 'lodash';

export const hasMoreThanOneItem = <T>(array: T[]): boolean => {
  if (isArray(array)) {
    return array.length > 1;
  }

  return false;
};
