import { Player } from '../models/player.interface';

export interface PlayersListResult {
  success: boolean;
  players?: Player[];
}
