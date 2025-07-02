import crypto from 'node:crypto';

import { isEmpty } from 'lodash';

import { Player } from '../models/player.interface';
import { MAN_WALKING_EMOJI } from './emoji.consts';

export class DiscordApiMessage {
  private id!: string;
  private message!: string;

  constructor(
    private readonly recipientId: string,
    private readonly server: string,
    private readonly numberOfPlayers: number,
    private readonly playersList: Player[],
  ) {
    this.initializeId();
    this.initializeMessage();
  }

  getId(): string {
    return this.id;
  }

  getRecipientId(): string {
    return this.recipientId;
  }

  getMessage(): string {
    return this.message;
  }

  private initializeId(): void {
    const string = `${this.recipientId};${this.server};${
      this.numberOfPlayers
    };${this.playersList.map((player) => player.name).join(',')};`;
    const md5Hasher = crypto.createHmac('md5', 'notasecret');

    this.id = md5Hasher.update(string).digest('hex');
  }

  private initializeMessage(): void {
    if (isEmpty(this.numberOfPlayers)) {
      this.message = `No players on server ${this.server}`;
    } else {
      this.message = `${this.numberOfPlayers} player${
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        this.numberOfPlayers === 1 ? '' : 's'
      } ${MAN_WALKING_EMOJI} on server ${this.server}: ${this.playersList
        .map((player) => player.name)
        .join(', ')}`;
    }
  }
}
