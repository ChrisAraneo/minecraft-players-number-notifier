/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { FileSystemMock } from './file-system.mock.class';

export class EmptyConfigFileSystemMock extends FileSystemMock {
  override readFile(
    _path: string,
    _options: unknown,
    callback: (err: NodeJS.ErrnoException | null, data: string) => void,
  ): void {
    callback(null, undefined as unknown as string);
  }
}
