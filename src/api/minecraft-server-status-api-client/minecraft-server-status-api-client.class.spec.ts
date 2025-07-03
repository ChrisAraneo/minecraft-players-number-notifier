import { Logger } from '@chris.araneo/logger';
import { firstValueFrom } from 'rxjs';

import { Config } from '../../models/config.type';
import { StatusResponse } from '../interfaces/status-response.interface';
import { MinecraftServerStatusApiClient } from './minecraft-server-status-api-client.class';

describe('MinecraftServerStatusApiClient', () => {
  let apiClient: MinecraftServerStatusApiClient;
  let logger: Logger;

  beforeEach(() => {
    logger = new LoggerMock() as unknown as Logger;
  });

  describe('getPlayersList', () => {
    it('should return successful response with players list', async () => {
      apiClient = new MinecraftServerStatusApiClient(
        config,
        logger,
        mockSuccessFetch,
      );
      MinecraftServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayersList('example.com'),
      );

      expect(result).toEqual({
        success: true,
        players: dummyResponse.players.list,
      });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new MinecraftServerStatusApiClient(
        config,
        logger,
        mockErrorFetch,
      );
      MinecraftServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getPlayersList('example.com'),
      );

      expect(result).toEqual({ success: false });
    });
  });

  describe('getNumberOfOnlinePlayers', () => {
    it('should return successful response with number of online players', async () => {
      apiClient = new MinecraftServerStatusApiClient(
        config,
        logger,
        mockSuccessFetch,
      );
      MinecraftServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getNumberOfOnlinePlayers('example.com'),
      );

      expect(result).toEqual({ success: true, online: 3 });
    });

    it('should return unsuccessful response', async () => {
      apiClient = new MinecraftServerStatusApiClient(
        config,
        logger,
        mockErrorFetch,
      );
      MinecraftServerStatusApiClient.clearCache();

      const result = await firstValueFrom(
        apiClient.getNumberOfOnlinePlayers('example.com'),
      );

      expect(result).toEqual({ success: false });
    });
  });
});

class LoggerMock {
  debug(): void {}
  error(): void {}
}

const config: Config = {
  'cache-ttl': 300,
  'log-level': '',
  servers: [],
  interval: 0,
  recipients: [],
  discord: false,
};

const dummyResponse: StatusResponse = {
  players: {
    online: 3,
    list: [
      {
        uuid: '6f9ca9ab-8f38-4cd8-a858-f8f2b950598a',
        name: 'John',
      },
      {
        uuid: '5a755c70-c39a-4811-a259-4e5aca7bdea7',
        name: 'Adam',
      },
      {
        uuid: '3af98ee8-16a4-4edb-9261-feb924a47d90',
        name: 'Beth',
      },
    ],
    max: 0,
  },
  ip: '',
  port: 0,
  debug: {
    ping: false,
    query: false,
    srv: false,
    querymismatch: false,
    ipinsrv: false,
    cnameinsrv: false,
    animatedmotd: false,
    cachehit: false,
    cachetime: 0,
    cacheexpire: 0,
    apiversion: 0,
    dns: {
      srv: [],
      srv_a: [],
    },
  },
  motd: {
    raw: [],
    clean: [],
    html: [],
  },
  version: '',
  online: false,
  protocol: {
    version: 0,
    name: '',
  },
  hostname: '',
  icon: '',
  map: {
    raw: '',
    clean: '',
    html: '',
  },
  eula_blocked: false,
};

const mockSuccessFetch = (async () => ({
  json: async () => dummyResponse,
})) as unknown as (url: any, init: any) => Promise<Response>;

const mockErrorFetch = (async (): Promise<unknown> => {
  throw new Error('Error');
}) as unknown as (url: any, init: any) => Promise<Response>;
