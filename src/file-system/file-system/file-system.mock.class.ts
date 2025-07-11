/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import {
  MakeDirectoryOptions,
  NoParamCallback,
  PathLike,
  PathOrFileDescriptor,
  Stats,
  WriteFileOptions,
} from 'node:fs';

import { FileSystem } from '@chris.araneo/file-system';

export class FileSystemMock extends FileSystem {
  override readdir(
    _path: PathLike,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void,
  ): void {
    callback(null, [
      'test.txt',
      'test2.txt',
      'test3.txt',
      'test.json',
      'test2.json',
      'test3.json',
    ]);
  }

  override stat(
    path: string,
    callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void,
  ): void {
    if (
      this.isCorrectTextFile(path) ||
      this.isCorrectEncryptedFile(path) ||
      this.isCorrectJsonFile(path) ||
      this.isCorrectConfigFile(path)
    ) {
      callback(null, {
        mtime: new Date('2023-10-27T21:33:39.661Z'),
      } as Stats);
    } else {
      callback('Error' as unknown as NodeJS.ErrnoException, {} as Stats);
    }
  }

  override readFile(
    path: string,
    _options: unknown,
    callback: (err: NodeJS.ErrnoException | null, data: string) => void,
  ): void {
    if (this.isCorrectTextFile(path)) {
      callback(null, 'Hello World!');
    } else if (this.isCorrectEncryptedFile(path)) {
      callback(
        null,
        'U2FsdGVkX19B53TiyfRaPnNzSe5uo2K8dIO/fD5h+slCLO30KJAjw4HGKxqRBgGC',
      );
    } else if (this.isCorrectConfigFile(path)) {
      callback(
        null,
        `{
                    "cache-ttl": 30000,
                    "discord": true,
                    "interval": 60000,
                    "log-level": "debug",
                    "recipients": [],
                    "servers": ["0.0.0.0"]
                }`,
      );
    } else if (this.isCorrectJsonFile(path)) {
      callback(null, '{"name":"Joel"}');
    } else {
      callback('Error' as unknown as NodeJS.ErrnoException, '');
    }
  }

  override async writeFile(
    _file: PathOrFileDescriptor,
    _data: string | NodeJS.ArrayBufferView,
    _options: WriteFileOptions,
    callback: NoParamCallback,
  ): Promise<void> {
    callback(null);
  }

  override existsSync(path: PathLike): boolean {
    return path !== 'notExistingDir';
  }

  override mkdirSync(
    path: PathLike,
    _options?: MakeDirectoryOptions & {
      recursive: true;
    },
    callback?: (err: NodeJS.ErrnoException | null, path?: string) => void,
  ): void {
    return callback && callback(null, path as string);
  }

  private isCorrectTextFile(path: string): boolean {
    return ['test.txt', 'test2.txt', 'test3.txt'].includes(path);
  }

  private isCorrectEncryptedFile(path: string): boolean {
    return ['test.mbe', 'directory/test.mbe'].includes(path);
  }

  private isCorrectJsonFile(path: string): boolean {
    return ['test.json', 'test2.json', 'test3.json'].includes(path);
  }

  private isCorrectConfigFile(path: string): boolean {
    return path.includes('config.json');
  }
}
