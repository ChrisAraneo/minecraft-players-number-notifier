import Path from 'path';
import { Observable, catchError, map } from 'rxjs';
import { Config } from '../../models/config.type';
import { JsonFile } from '../../models/json-file.class';
import { CurrentDirectory } from '../current-directory/current-directory.class';
import { JsonFileReader } from '../file-reader/json-file-reader.class';
import { FileSystem } from '../file-system/file-system.class';
import { CONFIG_READING_ERROR_MESSAGE, INVALID_CONFIG_ERROR_MESSAGE } from './config-loader.consts';

export class ConfigLoader {
    private jsonFileReader: JsonFileReader;

    constructor(
        protected currentDirectory: CurrentDirectory,
        protected fileSystem: FileSystem,
    ) {
        this.jsonFileReader = new JsonFileReader(fileSystem);
    }

    readConfigFile(): Observable<Config> {
        const currentDirectory = this.currentDirectory.getCurrentDirectory();
        const path = Path.normalize(`${currentDirectory}/config.json`);

        return this.jsonFileReader.readFile(path).pipe(
            catchError(() => {
                throw Error(CONFIG_READING_ERROR_MESSAGE);
            }),
            map((result: unknown) => {
                const content: unknown = (result as JsonFile)?.getContent();

                if (this.isConfig(content)) {
                    return content;
                } else {
                    throw Error(INVALID_CONFIG_ERROR_MESSAGE);
                }
            }),
        );
    }

    private isConfig(object: unknown): object is Config {
        if (!object) {
            return false;
        }

        const validServers = this.isStringArray((<Config>object).servers);
        const validDiscord = typeof (<Config>object).discord === 'boolean';
        const validCacheTTL = typeof (<Config>object)['cache-ttl'] === 'number';
        const validInterval = typeof (<Config>object).interval === 'number';
        const validLogLevel = typeof (<Config>object)['log-level'] === 'string';
        const validRecipients = this.isStringArray((<Config>object).recipients);

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
