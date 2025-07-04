/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { isArray } from 'lodash';

export const sliceTwo = <T>(array: T[]): [T, ...T[]] | [] => {
  if (isArray(array) && array.length >= 2) {
    return array.slice(2) as [T, ...T[]];
  }

  return [];
};
