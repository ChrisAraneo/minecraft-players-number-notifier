import {
  CurrentDirectory,
  CurrentDirectoryMock,
  FileSystem,
} from '@chris.araneo/file-system';
import { firstValueFrom } from 'rxjs';

import { EmptyConfigFileSystemMock } from '../file-system/empty-config-file-system.mock.class';
import { FileSystemMock } from '../file-system/file-system.mock.class';
import { InvalidConfigFileSystemMock } from '../file-system/invalid-config-file-system.mock.class';
import { InvalidJsonFileSystemMock } from '../file-system/invalid-json-file-system.mock.class';
import { ConfigLoader } from './config-loader.class';
import {
  CONFIG_READING_ERROR_MESSAGE,
  INVALID_CONFIG_ERROR_MESSAGE,
} from './config-loader.consts';

describe('ConfigLoader', () => {
  let fileSystem: FileSystem;
  let currentDirectory: CurrentDirectory;
  let configLoader: ConfigLoader;

  beforeEach(() => {
    currentDirectory = new CurrentDirectoryMock();
  });

  describe('readConfigFile', () => {
    it('should return config object when file contains valid config', async () => {
      fileSystem = new FileSystemMock();
      configLoader = new ConfigLoader(currentDirectory, fileSystem);

      const config = await firstValueFrom(configLoader.readConfigFile());

      expect(config).toStrictEqual({
        'cache-ttl': 30_000,
        discord: true,
        interval: 60_000,
        'log-level': 'debug',
        recipients: [],
        servers: ['0.0.0.0'],
      });
    });

    it('should throw error when file contains invalid properties or values', async () => {
      fileSystem = new InvalidConfigFileSystemMock();
      configLoader = new ConfigLoader(currentDirectory, fileSystem);

      try {
        await firstValueFrom(configLoader.readConfigFile());
      } catch (error: unknown) {
        expect((error as Error).message).toBe(INVALID_CONFIG_ERROR_MESSAGE);
      }
    });

    it('should throw error when file is invalid json', async () => {
      fileSystem = new InvalidJsonFileSystemMock();
      configLoader = new ConfigLoader(currentDirectory, fileSystem);

      try {
        await firstValueFrom(configLoader.readConfigFile());
      } catch (error: unknown) {
        expect((error as Error).message).toBe(CONFIG_READING_ERROR_MESSAGE);
      }
    });

    it('should throw error when result of reading file is empty', async () => {
      fileSystem = new EmptyConfigFileSystemMock();
      configLoader = new ConfigLoader(currentDirectory, fileSystem);

      try {
        await firstValueFrom(configLoader.readConfigFile());
      } catch (error: unknown) {
        expect((error as Error).message).toBe(CONFIG_READING_ERROR_MESSAGE);
      }
    });
  });
});
