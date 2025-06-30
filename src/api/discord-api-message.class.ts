/* eslint-disable @typescript-eslint/max-params */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import crypto from 'node:crypto';

import { Player } from '../models/player.interface';

export class DiscordApiMessage {
  private id!: string;
  private message!: string;

  constructor(
    private readonly recipientId: string,
    private readonly server: string,
    private readonly numberOfPlayers = 0,
    private readonly playersList: Player[] = [],
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
    const string = `${this.recipientId};${this.server};${this.numberOfPlayers
      };${this.playersList.map((player) => player.name).join(',')};`;
    const md5Hasher = crypto.createHmac('md5', 'notasecret');

    this.id = md5Hasher.update(string).digest('hex');
  }

  private initializeMessage(): void {
    if (this.numberOfPlayers === 0) {
      this.message = `No players on server ${this.server}`;
    } else {
      const manWalkingEmoji = String.fromCodePoint(0x1_F6_B6);

      this.message = `${this.numberOfPlayers} player${this.numberOfPlayers === 1 ? '' : 's'
        } ${manWalkingEmoji} on server ${this.server}: ${this.playersList
          .map((player) => player.name)
          .join(', ')}`;
    }
  }
}
