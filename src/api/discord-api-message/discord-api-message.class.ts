import crypto from 'node:crypto';

import { Player } from '../../models/player.interface';
import { MAN_WALKING_EMOJI } from '../../utils/emoji.consts';

export class DiscordApiMessage {
  private id!: string;
  private hasNoPlayers!: boolean;
  private hasOnePlayer!: boolean;
  private message!: string;

  constructor(
    private readonly recipientId: string,
    private readonly server: string,
    private readonly playerCount: number,
    private readonly players: Player[],
  ) {
    this.initializeId();
    this.initializePlayerCountFlags();
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

  private initializePlayerCountFlags(): void {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this.hasNoPlayers = this.playerCount === 0;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this.hasOnePlayer = this.playerCount === 1;
  }

  private initializeMessage(): void {
    if (this.hasNoPlayers) {
      this.message = `No players on server ${this.server}`;
    } else if (this.hasOnePlayer) {
      this.message = `${this.playerCount} player ${MAN_WALKING_EMOJI} on server ${this.server}: ${this.playerNames(this.players)}`;
    } else {
      this.message = `${this.playerCount} players ${MAN_WALKING_EMOJI} on server ${this.server}: ${this.playerNames(this.players)}`;
    }
  }

  private playerNames(players: Player[]): string {
    return players.map((player) => player.name).join(', ');
  }
}
