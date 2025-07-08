import { Logger } from '@chris.araneo/logger';
import { noop } from 'rxjs';

import { Config } from '../../models/config.type';
import { StatusResponse } from '../interfaces/status-response.interface';

export class LoggerMock extends Logger {
  override debug = noop;
  override error = noop;
}

export const DUMMY_CONFIG: Config = {
  'cache-ttl': 300,
  'log-level': '',
  servers: [],
  interval: 0,
  recipients: [],
  discord: false,
};

export const DUMMY_RESPONSE: StatusResponse = {
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
      // eslint-disable-next-line camelcase
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
  // eslint-disable-next-line camelcase
  eula_blocked: false,
};
