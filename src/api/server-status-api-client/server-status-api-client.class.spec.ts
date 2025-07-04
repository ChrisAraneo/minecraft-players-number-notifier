import { Logger } from '@chris.araneo/logger';
import { firstValueFrom } from 'rxjs';

import { ServerStatusApiClient } from './server-status-api-client.class';
import { DUMMY_CONFIG, DUMMY_RESPONSE, LoggerMock, mockErrorFetch, mockSuccessFetch } from './server-status-api-client.class.data.spec';

describe('ServerStatusApiClient', () => {
  let apiClient: ServerStatusApiClient;
  let logger: Logger;

  beforeEach(() => {
    logger = new LoggerMock();
  });

  describe('getPlayersList', () => {
    it('should return successful response with players list', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        mockSuccessFetch,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayersList('example.com'),
      );

      expect(result).toEqual({
        success: true,
        players: DUMMY_RESPONSE.players.list,
      });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        mockErrorFetch,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayersList('example.com'),
      );

      expect(result).toEqual({ success: false });
    });
  });

  describe('getNumberOfOnlinePlayers', () => {
    it('should return successful response with number of online players', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        mockSuccessFetch,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getNumberOfOnlinePlayers('example.com'),
      );

      expect(result).toEqual({ success: true, online: 3 });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new ServerStatusApiClient(
        DUMMY_CONFIG,
        logger,
        mockErrorFetch,
      );
      ServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getNumberOfOnlinePlayers('example.com'),
      );

      expect(result).toEqual({ success: false });
    });
  });
});

