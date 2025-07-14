/* eslint-disable @typescript-eslint/no-magic-numbers */

import { CurrentDirectory, FileSystem } from '@chris.araneo/file-system';
import { HealthCheckService } from '@chris.araneo/health-check';
import { Logger } from '@chris.araneo/logger';
import dashify from 'dashify';
import {
  get,
  isArray,
  isEmpty,
  isNull,
  isNumber,
  isUndefined,
  set,
} from 'lodash';
import fetch from 'node-fetch-native';
import {
  catchError,
  EMPTY,
  firstValueFrom,
  from,
  interval,
  map,
  mergeMap,
  Observable,
  OperatorFunction,
  tap,
} from 'rxjs';

import { DiscordApiClient } from './api/discord-api-client/discord-api-client.class';
import { NumberOfOnlinePlayersResult } from './api/interfaces/number-of-online-players-result.interface';
import { PlayersListResult } from './api/interfaces/players-list-result.interface';
import { ServerStatusApiClient } from './api/server-status-api-client/server-status-api-client.class';
import { ConfigLoader } from './file-system/config-loader/config-loader.class';
import { Config } from './models/config.type';
import { Player } from './models/player.interface';
import { ServerStatus } from './models/server-status.interface';
import { EnvironmentVariables } from './process/environment-variables.class';
import { Process } from './process/process.class';
import { Store } from './store/store.class';
import { isLogLevelOrThrow } from './utils/is-log-level-or-throw.function';
import { isStringArrayOrThrow } from './utils/is-string-array-or-throw.function';

export class MinecraftServerStatusNotifier {
  private readonly store = new Store();

  private process!: Process;
  private logger!: Logger;
  private config!: Config;
  private discordApiClient: DiscordApiClient | null = null;
  private apiClient!: ServerStatusApiClient;

  async initialize(): Promise<void> {
    await this.loadConfiguration();

    const environmentVariables = this.loadEnvironmentVariables();

    if (environmentVariables.CI) {
      return;
    }

    if (!this.validateConfiguration()) {
      return;
    }

    this.initializeLogger();
    this.initializeDiscordClient();
    this.initializeApiClient();

    this.startHealthCheckService(environmentVariables);
    this.startPollingServers();
    this.subscribeToServerStatusesChanges();
  }

  private async loadConfiguration(): Promise<void> {
    this.process = new Process();
    const currentDirectory = new CurrentDirectory();
    const fileSystem = new FileSystem();
    const configLoader = new ConfigLoader(currentDirectory, fileSystem);

    const config = await firstValueFrom(configLoader.readConfigFile()).catch(
      (error: unknown) => new Logger('error').error(String(error)),
    );

    if (config) {
      this.config = config;
    }
  }

  private validateConfiguration(): boolean {
    if (isEmpty(Object.keys(this.config))) {
      new Logger('error').error('No config');
      return false;
    }
    return true;
  }

  private initializeLogger(): void {
    const logLevel = this.config['log-level'];

    isLogLevelOrThrow(logLevel);

    this.logger = new Logger(logLevel);
    this.logger.info('Minecraft Players Number Notifier v0.5.3');
    this.logger.debug(`Loaded configuration: ${JSON.stringify(this.config)}`);
  }

  private initializeApiClient(): void {
    this.apiClient = new ServerStatusApiClient(this.config, this.logger, fetch);
  }

  private loadEnvironmentVariables(): Record<
    string,
    string | string[] | undefined
  > {
    const environmentVariables = new EnvironmentVariables(this.process).get();

    for (const [key, value] of Object.entries(environmentVariables)) {
      if (!isUndefined(value)) {
        set(this.config, dashify(key).split('_').join('-'), value);
      }
    }

    return environmentVariables;
  }

  private initializeDiscordClient(): void {
    const token = this.config['discord-token'] || null;
    const predefinedRecipients = this.config.recipients || [];

    if (Boolean(this.config.discord) && isNull(token)) {
      this.logger.error('Token is null');
      return;
    }

    this.discordApiClient =
      this.config.discord && !isNull(token)
        ? new DiscordApiClient(
            this.config,
            this.logger,
            isArray(predefinedRecipients)
              ? [...predefinedRecipients]
              : [String(predefinedRecipients)],
          )
        : null;
  }

  private startHealthCheckService(
    environmentVariables: Record<string, unknown>,
  ): void {
    if (environmentVariables.MPNN_HEALTH_CHECK_PORT) {
      void new HealthCheckService(
        '/health',
        Number(environmentVariables.MPNN_HEALTH_CHECK_PORT),
        this.logger,
      ).listen();
    }
  }

  private startPollingServers(): void {
    const servers = this.config.servers || [];

    isStringArrayOrThrow(servers);

    interval(Number(this.config.interval))
      .pipe(
        mergeMap(() => from(servers)),
        tap((server: string) => {
          const playerCount = this.apiClient.getPlayerCount(server);
          const getListOfPlayerNames = this.apiClient.getPlayers(server);

          void firstValueFrom(
            playerCount.pipe(
              this.logNumberOfPlayers(server),
              this.logPlayerNames(getListOfPlayerNames, server),
            ),
          );
        }),
        catchError((error: unknown) => {
          this.logger.error(
            JSON.stringify(error, Object.getOwnPropertyNames(error)),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private subscribeToServerStatusesChanges(): void {
    this.store
      .getServerStatuses()
      .pipe(
        mergeMap((statuses) => from(statuses)),
        catchError((error: unknown) => {
          this.logger.error(
            JSON.stringify(error, Object.getOwnPropertyNames(error)),
          );
          return EMPTY;
        }),
      )
      .subscribe((status) => this.sendNotifications(status));
  }

  private logNumberOfPlayers(
    server: string,
  ): OperatorFunction<
    NumberOfOnlinePlayersResult,
    NumberOfOnlinePlayersResult
  > {
    return tap((result: NumberOfOnlinePlayersResult) => {
      if (!isNumber(result.online)) {
        this.logger.info(
          `Could not read number of players on server ${server}.`,
        );
      } else if (result.online === 1) {
        this.logger.info(
          `Server ${server} has currently: ${result.online} player.`,
        );
      } else {
        this.logger.info(
          `Server ${server} has currently: ${result.online} players.`,
        );
      }
    });
  }

  private logPlayerNames(
    getListOfPlayerNames: Observable<PlayersListResult>,
    server: string,
  ): OperatorFunction<NumberOfOnlinePlayersResult, Player[]> {
    return mergeMap((onlineResult: NumberOfOnlinePlayersResult) =>
      getListOfPlayerNames.pipe(
        tap((playersResult) => {
          if (playersResult.success && !isEmpty(playersResult.players)) {
            this.logger.info(
              `Players online: ${(playersResult.players ?? [])
                .map((player) => player.name)
                .join(', ')}`,
            );
          } else {
            this.logger.warn(
              `Can't list names of online players on ${server}.`,
            );
          }
        }),
        tap((result: PlayersListResult) => {
          this.store.updateServerStatus({
            server,
            online: get(onlineResult, 'online', 0),
            players: get(result, 'players', []),
          });
        }),
        map((result) => result.players ?? []),
      ),
    );
  }

  private sendNotifications(status: ServerStatus): void {
    if (this.discordApiClient) {
      void this.discordApiClient.sendMessage(
        status.server,
        status.online,
        status.players ?? [],
      );
    }
  }
}
