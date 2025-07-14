import { CurrentDirectory, FileSystem } from '@chris.araneo/file-system';
import { HealthCheckService } from '@chris.araneo/health-check';
import { Logger, LogLevel } from '@chris.araneo/logger';
import dashify from 'dashify';
import { get, isEmpty, isNull, isNumber, isUndefined, set } from 'lodash';
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

export class MinecraftServerStatusNotifier {
  private logger!: Logger;
  private config!: Config;
  private discordApiClient: DiscordApiClient | null = null;
  private apiClient!: ServerStatusApiClient;
  private readonly store = new Store();

  async initialize(): Promise<void> {
    const process = new Process();
    const currentDirectory = new CurrentDirectory();
    const fileSystem = new FileSystem();

    const configLoader = new ConfigLoader(currentDirectory, fileSystem);
    this.config =
      (await firstValueFrom(configLoader.readConfigFile()).catch(
        (error: unknown) => new Logger('error').error(String(error)),
      )) ?? {};

    const environmentVariables = new EnvironmentVariables(process).get();

    if (environmentVariables.CI) {
      return;
    }

    this.loadEnvironmentVariables(environmentVariables);

    if (isEmpty(Object.keys(this.config))) {
      new Logger('error').error('No config');
      return;
    }

    this.logger = new Logger(this.config['log-level'] as LogLevel);
    this.logger.info('Minecraft Players Number Notifier v0.5.3');
    this.logger.debug(`Loaded configuration: ${JSON.stringify(this.config)}`);

    this.initializeDiscordClient();
    this.apiClient = new ServerStatusApiClient(this.config, this.logger, fetch);

    this.startHealthCheckService(environmentVariables);
    this.startMonitoring();
    this.subscribeToNotifications();
  }

  private loadEnvironmentVariables(
    environmentVariables: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(environmentVariables)) {
      if (!isUndefined(value)) {
        set(this.config, dashify(key).split('_').join('-'), value);
      }
    }
  }

  private initializeDiscordClient(): void {
    const token: string | null = (this.config['discord-token'] || null) as
      | string
      | null;
    const predefinedRecipients = (this.config.recipients || []) as
      | string
      | string[];

    if (Boolean(this.config.discord) && isNull(token)) {
      this.logger.error('Token is null');
      return;
    }

    this.discordApiClient =
      this.config.discord && !isNull(token)
        ? new DiscordApiClient(
            this.config,
            this.logger,
            Array.isArray(predefinedRecipients)
              ? [...predefinedRecipients]
              : [predefinedRecipients],
          )
        : null;
  }

  private startHealthCheckService(
    environmentVariables: Record<string, unknown>,
  ): void {
    if (environmentVariables.MPNN_HEALTH_CHECK_PORT) {
      new HealthCheckService(
        '/health',
        Number(environmentVariables.MPNN_HEALTH_CHECK_PORT),
        this.logger,
      ).listen();
    }
  }

  private startMonitoring(): void {
    interval(Number(this.config.interval))
      .pipe(
        mergeMap(() => from((this.config.servers as string[]) || [])),
        tap((server: string) => {
          const playerCount = this.apiClient.getPlayerCount(server);
          const getListOfPlayerNames = this.apiClient.getPlayers(server);

          firstValueFrom(
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

  private subscribeToNotifications(): void {
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

  private logNumberOfPlayers(server: string) {
    return tap((result: NumberOfOnlinePlayersResult) => {
      if (!isNumber(result?.online)) {
        this.logger.info(
          `Could not read number of players on server ${server}.`,
        );
      } else if (result.online === 1) {
        this.logger.info(
          `Server ${server} has currently: ${result?.online} player.`,
        );
      } else {
        this.logger.info(
          `Server ${server} has currently: ${result?.online} players.`,
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
          if (
            playersResult.success &&
            (playersResult?.players || []).length > 0
          ) {
            this.logger.info(
              `Players online: ${(playersResult?.players || [])
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
        map((result) => result?.players || []),
      ),
    );
  }

  private sendNotifications(status: ServerStatus): void {
    if (this.discordApiClient) {
      this.discordApiClient.sendMessage(
        status.server,
        status.online,
        status.players || [],
      );
    }
  }
}
