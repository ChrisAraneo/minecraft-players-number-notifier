import { Player } from '../models/player.interface';

export interface StatusResponse {
  ip: string;
  port: number;
  debug: {
    ping: boolean;
    query: boolean;
    srv: boolean;
    querymismatch: boolean;
    ipinsrv: boolean;
    cnameinsrv: boolean;
    animatedmotd: boolean;
    cachehit: boolean;
    cachetime: number;
    cacheexpire: number;
    apiversion: number;
    dns?: {
      srv: unknown[];
      srv_a: unknown[];
    };
  };
  motd: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  players: {
    online: number;
    max: number;
    list?: Player[];
  };
  version: string;
  online: boolean;
  protocol: {
    version: number;
    name: string;
  };
  hostname: string;
  icon: string;
  map: {
    raw: string;
    clean: string;
    html: string;
  };
  eula_blocked: boolean;
}
