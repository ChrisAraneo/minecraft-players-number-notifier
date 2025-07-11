import { Logger } from '@chris.araneo/logger';
import { get, isArray, isNaN, isNull, isNumber } from 'lodash';
import { from, map, Observable, of } from 'rxjs';

import { Config } from '../../models/config.type';
import { Cache } from '../interfaces/cache.interface';
import { NumberOfOnlinePlayersResult } from '../interfaces/number-of-online-players-result.interface';
import { PlayersListResult } from '../interfaces/players-list-result.interface';
import { StatusResponse } from '../interfaces/status-response.interface';

export class ServerStatusApiClient {
  private static readonly StatusEndpoint = `https://api.mcsrvstat.us/3`;
  private static Cache = new Map<string, Cache>();

  private readonly CacheTTL: number;

  constructor(
    private readonly config: Config,
    private readonly logger: Logger,
    private readonly fetch: (
      url: string,
      init?: RequestInit,
    ) => Promise<Response>,
  ) {
    this.CacheTTL = Number(this.config['cache-ttl']);
  }

  static clearCache(): void {
    ServerStatusApiClient.Cache = new Map<string, Cache>();
  }

  getPlayers(
    server: string,
    now: Date = new Date(),
  ): Observable<PlayersListResult> {
    return this.getServerStatus(server, now).pipe(
      map((response) => {
        const players = get(response, 'players.list');

        if (players && isArray(players)) {
          return {
            success: true,
            players,
          };
        }

        return {
          success: false,
        };
      }),
    );
  }

  getPlayerCount(
    server: string,
    now: Date = new Date(),
  ): Observable<NumberOfOnlinePlayersResult> {
    return this.getServerStatus(server, now).pipe(
      map((response) => {
        const onlinePlayers = Number(get(response, 'players.online'));

        if (isNaN(onlinePlayers)) {
          return {
            success: false,
          };
        }

        return {
          success: true,
          online: onlinePlayers,
        };
      }),
    );
  }

  private getServerStatus(
    server: string,
    now: Date,
  ): Observable<StatusResponse | null> {
    const cached = this.getCache(server);

    if (this.isCacheOutdated(cached, now)) {
      return from(
        this.fetchServerStatus(server)
          .then((response) => {
            if (!isNull(response)) {
              this.updateCache(server, now, response);
            }

            return response ?? null;
          })
          .catch(() => {
            this.logger.error('Error while fetching server status');

            return null;
          }),
      );
    }

    if (isNumber(cached?.timestamp)) {
      this.logger.debug(
        `Status cache didn't expire yet ${new Date(
          cached.timestamp,
        ).toISOString()} < ${now.toISOString()}`,
      );
    }

    return of(cached?.response ?? null);
  }

  private async fetchServerStatus(
    server: string,
  ): Promise<StatusResponse | null> {
    const url = `${ServerStatusApiClient.StatusEndpoint}/${server}`;

    this.logger.debug(`GET ${url}`);

    return this.fetch(url)
      .then((response) => response.json() as unknown)
      .then((json) => {
        this.logger.debug(`GET response`, json);

        return (json ?? null) as StatusResponse | null;
      })
      .catch((error: unknown) => {
        this.logger.error(`Error fetching server status for ${server}`, error);

        return null;
      });
  }

  private getCache(server: string): Cache | undefined {
    return ServerStatusApiClient.Cache.get(server);
  }

  private isCacheOutdated(cached: Cache | undefined, now: Date): boolean {
    return (
      !cached?.timestamp ||
      Number(cached.timestamp) + this.CacheTTL < Number(now)
    );
  }

  private updateCache(
    server: string,
    timestamp: Date,
    response: StatusResponse,
  ): void {
    ServerStatusApiClient.Cache.set(server, {
      timestamp,
      response,
    });
  }
}
