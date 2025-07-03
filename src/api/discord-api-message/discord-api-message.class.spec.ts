import { Player } from '../../models/player.interface';
import { DiscordApiMessage } from './discord-api-message.class';

describe('DiscordApiMessage', () => {
  let recipientId: string;
  let server: string;
  let playerCount: number;
  let players: Player[];

  beforeEach(() => {
    recipientId = '5468';
    server = 'example.com';
    playerCount = 2;
    players = [
      {
        uuid: '6f9ca9ab-8f38-4cd8-a858-f8f2b950598a',
        name: 'John',
      },
      {
        uuid: '5a755c70-c39a-4811-a259-4e5aca7bdea7',
        name: 'Adam',
      },
    ];
  });

  describe('getId', () => {
    it('should return id', () => {
      const message = new DiscordApiMessage(
        recipientId,
        server,
        playerCount,
        players,
      );

      expect(message.getId()).toEqual('c615b6276813e57a0f463b75b44407ec');
    });
  });

  describe('getRecipientId', () => {
    it('should return recipient id', () => {
      const message = new DiscordApiMessage(
        recipientId,
        server,
        playerCount,
        players,
      );

      expect(message.getRecipientId()).toEqual(recipientId);
    });
  });

  describe('getMessage', () => {
    it('should return message content', () => {
      const message = new DiscordApiMessage(
        recipientId,
        server,
        playerCount,
        players,
      );

      expect(message.getMessage()).toEqual(
        `2 players ${String.fromCodePoint(
          0x1_f6_b6,
        )} on server example.com: John, Adam`,
      );
    });
  });
});
