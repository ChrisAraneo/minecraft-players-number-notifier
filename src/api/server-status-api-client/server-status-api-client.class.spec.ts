import { Logger } from '@chris.araneo/logger';
import { firstValueFrom } from 'rxjs';

import { ServerStatusApiClient } from './server-status-api-client.class';
import {
  DUMMY_CONFIG,
  DUMMY_RESPONSE,
  LoggerMock,
} from './server-status-api-client.class.spec.data';

describe('ServerStatusApiClient', () => {
  let apiClient: ServerStatusApiClient;
  let logger: Logger;

  beforeEach(() => {
    logger = new LoggerMock();
  });

  describe('getPlayers', () => {
    it('should return successful response with players list', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        (url: string, init?: RequestInit | undefined) => {
          return Promise.resolve({
            json: () => Promise.resolve(DUMMY_RESPONSE),
          }) as unknown as Promise<Response>;
        },
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(apiClient.getPlayers('example.com'));

      expect(result).toEqual({
        success: true,
        players: DUMMY_RESPONSE.players.list,
      });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        (async (): Promise<unknown> => {
          throw new Error('Error');
        }) as unknown as (url: any, init: any) => Promise<Response>,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(apiClient.getPlayers('example.com'));

      expect(result).toEqual({
        success: false,
      });
    });
  });

  describe('getPlayerCount', () => {
    it('should return successful response with number of online players', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        (url: string, init?: RequestInit | undefined) => {
          return Promise.resolve({
            json: () => Promise.resolve(DUMMY_RESPONSE),
          }) as unknown as Promise<Response>;
        },
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayerCount('example.com'),
      );

      expect(result).toEqual({
        success: true,
        online: 3,
      });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        (async (): Promise<unknown> => {
          throw new Error('Error');
        }) as unknown as (url: any, init: any) => Promise<Response>,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayerCount('example.com'),
      );

      expect(result).toEqual({
        success: false,
      });
    });
  });
});
