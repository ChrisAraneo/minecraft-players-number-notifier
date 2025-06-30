import Path from 'node:path';

import {
  CurrentDirectory,
  FileSystem,
  JsonFile,
  JsonFileReader,
} from '@chris.araneo/file-system';
import { catchError, map, Observable } from 'rxjs';

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
      map((result: unknown) => (result as JsonFile)?.getContent()),
      catchError(() => {
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

    const validServers = this.isStringArray((object as Config).servers);
    const validDiscord = typeof (object as Config).discord === 'boolean';
    const validCacheTTL = typeof (object as Config)['cache-ttl'] === 'number';
    const validInterval = typeof (object as Config).interval === 'number';
    const validLogLevel = typeof (object as Config)['log-level'] === 'string';
    const validRecipients = this.isStringArray((object as Config).recipients);

    return (
      validServers &&
      validDiscord &&
      validCacheTTL &&
      validInterval &&
      validLogLevel &&
      validRecipients
    );
  }

  private isStringArray(object: unknown): object is string[] {
    return Array.isArray(object) && object.every((i) => typeof i === 'string');
  }
}
