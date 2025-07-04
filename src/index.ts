import { CurrentDirectory, FileSystem } from '@chris.araneo/file-system';
import { HealthCheckService } from '@chris.araneo/health-check';
import { Logger, LogLevel } from '@chris.araneo/logger';
import dashify from 'dashify';
import { get, isNull, isNumber, isUndefined } from 'lodash';
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

(async (): Promise<void> => {
  const process = new Process();
  const currentDirectory = new CurrentDirectory();
  const fileSystem = new FileSystem();
  const store = new Store();

  const configLoader = new ConfigLoader(currentDirectory, fileSystem);
  const config: Config | Record<string, never> =
    (await firstValueFrom(configLoader.readConfigFile()).catch((error) =>
      new Logger('error').error(error),
    )) || {};

  const environmentVariables = new EnvironmentVariables(process).get();

  if (environmentVariables.CI) {
    return;
  }

  for (const [key, value] of Object.entries(environmentVariables)) {
    if (!isUndefined(value)) {
      config[dashify(key).split('_').join('-')] = value;
    }
  }

  if (Object.keys(config).length === 0) {
    new Logger('error').error('No config');
    return;
  }

  const logger: Logger = new Logger(config['log-level'] as LogLevel);

  logger.info('Minecraft Players Number Notifier v0.5.3');
  logger.debug(`Loaded configuration: ${JSON.stringify(config)}`);

  const token: string | null = (config['discord-token'] || null) as
    | string
    | null;

  const predefinedRecipients = (config.recipients || []) as string | string[];
  if (Boolean(config.discord) && isNull(token)) {
    logger.error('Token is null');
    return;
  }
  const discordApiClient: DiscordApiClient | null =
    config.discord && !isNull(token)
      ? new DiscordApiClient(
          config,
          logger,
          Array.isArray(predefinedRecipients)
            ? [...predefinedRecipients]
            : [predefinedRecipients],
        )
      : null;
  const apiClient = new ServerStatusApiClient(config, logger, fetch);

  if (environmentVariables.MPNN_HEALTH_CHECK_PORT) {
    new HealthCheckService(
      '/health',
      Number(environmentVariables.MPNN_HEALTH_CHECK_PORT),
      logger,
    ).listen();
  }

  function logNumberOfPlayers(server: string) {
    return tap((result: NumberOfOnlinePlayersResult) => {
      if (!isNumber(result?.online)) {
        logger.info(`Could not read number of players on server ${server}.`);
      } else if (result.online === 1) {
        logger.info(
          `Server ${server} has currently: ${result?.online} player.`,
        );
      } else {
        logger.info(
          `Server ${server} has currently: ${result?.online} players.`,
        );
      }
    });
  }

  function logPlayerNames(
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
            logger.info(
              `Players online: ${(playersResult?.players || [])
                .map((player) => player.name)
                .join(', ')}`,
            );
          } else {
            logger.warn(`Can't list names of online players on ${server}.`);
          }
        }),
        tap((result: PlayersListResult) => {
          store.updateServerStatus({
            server,
            online: get(onlineResult, 'online', 0),
            players: get(result, 'players', []),
          });
        }),
        map((result) => result?.players || []),
      ),
    );
  }

  function sendNotifications(status: ServerStatus): void {
    if (discordApiClient) {
      discordApiClient.sendMessage(
        status.server,
        status.online,
        status.players || [],
      );
    }
  }

  interval(Number(config.interval))
    .pipe(
      mergeMap(() => from((config.servers as string[]) || [])),
      tap((server: string) => {
        const playerCount = apiClient.getPlayerCount(server);
        const getListOfPlayerNames = apiClient.getPlayers(server);

        firstValueFrom(
          playerCount.pipe(
            logNumberOfPlayers(server),
            logPlayerNames(getListOfPlayerNames, server),
          ),
        );
      }),
      catchError((error: unknown) => {
        logger.error(JSON.stringify(error, Object.getOwnPropertyNames(error)));

        return EMPTY;
      }),
    )
    .subscribe();

  store
    .getServerStatuses()
    .pipe(
      mergeMap((statuses) => from(statuses)),
      catchError((error: unknown) => {
        logger.error(JSON.stringify(error, Object.getOwnPropertyNames(error)));

        return EMPTY;
      }),
    )
    .subscribe((status) => sendNotifications(status));
})();
