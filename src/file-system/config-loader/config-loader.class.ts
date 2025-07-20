import Path from 'node:path';

import {
  CurrentDirectory,
  FileSystem,
  JsonFile,
  JsonFileReader,
} from '@chris.araneo/file-system';
import { get } from 'lodash';
import { map, Observable } from 'rxjs';

import { Config } from '../../models/config.type';
import {
  CONFIG_READING_ERROR_MESSAGE,
  INVALID_CONFIG_ERROR_MESSAGE,
} from './config-loader.consts';

export class ConfigLoader {
  private readonly jsonFileReader: JsonFileReader;

  constructor(
    protected currentDirectory: CurrentDirectory,
    protected fileSystem: FileSystem,
  ) {
    this.jsonFileReader = new JsonFileReader(fileSystem);
  }

  readConfigFile(): Observable<Config> {
    const currentDirectory = this.currentDirectory.getCurrentDirectory();
    const path = Path.normalize(`${currentDirectory}/dist/src/config.json`);

    return this.jsonFileReader.readFile(path).pipe(
      map((result: unknown) => {
        if (result instanceof JsonFile) {
          return result.getContent();
        }

        throw new Error(CONFIG_READING_ERROR_MESSAGE);
      }),
      map((content: unknown) => {
        if (this.isConfig(content)) {
          return content;
        }
        throw new Error(INVALID_CONFIG_ERROR_MESSAGE);
      }),
    );
  }

  private isConfig(object: unknown): object is Config {
    if (!object) {
      return false;
    }

    const isServersValid = this.isStringArray(get(object, 'servers'));
    const isDiscordValid = typeof get(object, 'discord') === 'boolean';
    const isCacheTtlValid = typeof get(object, 'cache-ttl') === 'number';
    const isIntervalValid = typeof get(object, 'interval') === 'number';
    const isLogLevelValid = typeof get(object, 'log-level') === 'string';
    const isRecipientsValid = this.isStringArray(get(object, 'recipients'));

    return (
      isServersValid &&
      isDiscordValid &&
      isCacheTtlValid &&
      isIntervalValid &&
      isLogLevelValid &&
      isRecipientsValid
    );
  }

  private isStringArray(object: unknown): object is string[] {
    return Array.isArray(object) && object.every((i) => typeof i === 'string');
  }
}
