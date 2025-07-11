import { isFunction } from 'lodash';

export const runWithRetry = async <T>(
  fn: () => Promise<T>,
  errorFn?: (error: unknown) => void,
): Promise<T> => {
  try {
    return await fn();
  } catch(error: unknown) {
    if (isFunction(errorFn)) {
      errorFn(error);
    }
  }

  return runWithRetry(fn, errorFn);
};
