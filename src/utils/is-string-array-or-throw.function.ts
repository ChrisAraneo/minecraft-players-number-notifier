import { isArray, isString } from 'lodash';

export const isStringArrayOrThrow: (
  value: unknown,
  errorMessage?: string,
) => asserts value is string[] = (
  value: unknown,
  errorMessage?: string,
): asserts value is string[] => {
  if (!isArray(value)) {
    throw new TypeError(errorMessage ?? 'Value is not an array');
  }

  if (!value.every((item): item is string => isString(item))) {
    throw new TypeError(errorMessage ?? 'Array contains non-string elements');
  }
};
