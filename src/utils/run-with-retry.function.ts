import { isFunction } from 'lodash';

export const runWithRetry = async <T>(
  fn: () => Promise<T>,
  errorFn?: () => void,
): Promise<T> => {
  try {
    return await fn();
  } catch {
    if (isFunction(errorFn)) {
      errorFn();
    }
  }

  return runWithRetry(fn, errorFn);
};
