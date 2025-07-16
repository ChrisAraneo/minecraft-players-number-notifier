import { Player } from '../../models/player.interface';

export interface PlayersListRequestResult {
  success: boolean;
  players?: Player[];
}
