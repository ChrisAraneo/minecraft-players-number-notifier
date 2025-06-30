import { Player } from './player.interface';

export interface ServerStatus {
  server: string;
  online: number;
  players?: Player[];
}
