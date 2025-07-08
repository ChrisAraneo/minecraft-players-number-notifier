import crypto from 'node:crypto';

import { Player } from '../../models/player.interface';
import { MAN_WALKING_EMOJI } from '../../utils/emoji.consts';
import { isOne } from '../../utils/is-one.function';
import { isZero } from '../../utils/is-zero.function';

export class DiscordApiMessage {
  private id!: string;
  private message!: string;

  constructor(
    private readonly recipientId: string,
    private readonly server: string,
    private readonly playerCount: number,
    private readonly players: Player[],
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
    const string =
      `${this.recipientId};${this.server};${this.playerCount};${this.playerNames(this.players)}`.replaceAll(
        ' ',
        '',
      );
    const md5Hasher = crypto.createHmac('md5', 'notasecret');

    this.id = md5Hasher.update(string).digest('hex');
  }

  private initializeMessage(): void {
    if (isZero(this.playerCount)) {
      this.message = `No players on server ${this.server}`;
    } else if (isOne(this.playerCount)) {
      this.message = `${this.playerCount} player ${MAN_WALKING_EMOJI} on server ${this.server}: ${this.playerNames(this.players)}`;
    } else {
      this.message = `${this.playerCount} players ${MAN_WALKING_EMOJI} on server ${this.server}: ${this.playerNames(this.players)}`;
    }
  }

  private playerNames(players: Player[]): string {
    return players.map((player) => player.name).join(', ');
  }
}
