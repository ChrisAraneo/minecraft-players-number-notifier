/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-undefined */

export const second = <T>(array: T[]): T | undefined =>
  array.length < 2 ? undefined : array[1];
