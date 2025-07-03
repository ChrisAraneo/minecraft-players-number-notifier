import { Logger } from '@chris.araneo/logger';
import { Client, Events, Partials, User } from 'discord.js';
import { noop } from 'lodash';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';

import { Config } from '../../models/config.type';
import { Player } from '../../models/player.interface';
import { THUMBS_UP_EMOJI, WAVING_HAND_EMOJI } from '../../utils/emoji.consts';
import { DiscordApiMessage } from '../discord-api-message/discord-api-message.class';
import { MESSAGE_TO_SEND_DEBOUNCE_TIME } from './discord-api-client.consts';

export class DiscordApiClient {
  private client!: Client;
  private readonly recipientIds: string[] = [];
  private readonly pendingMessages = new BehaviorSubject<DiscordApiMessage[]>(
    [],
  );
  private readonly subscription = new Subscription();

  constructor(
    private readonly config: Config,
    private readonly logger: Logger,
    recipientIds: string[] = [],
  ) {
    if (this.config.discord) {
      this.logger.info(`Discord bot is enabled.`);

      this.initializeClient();
      this.addRecipients(recipientIds);
      this.login()
        .then(() => {
          this.subscribeToReceivedMessages();
          this.subscribeToPendingMessages();
        })
        .catch((error: unknown) => {
          this.logger.error(
            'Error during DiscordApiClient initialization',
            error,
          );
        });
    }
  }

  async sendMessage(
    server: string,
    numberOfPlayers: number,
    playersList: Player[],
  ): Promise<void> {
    await Promise.all(
      this.recipientIds.map(async (id) => {
        let user: User | undefined;

        while (!user) {
          try {
            user = await this.client.users.fetch(id);
          } catch {
            this.logger.error(`Could not fetch user with ID ${id}`);

            void this.login();
          }
        }

        this.addPendingMessage(
          new DiscordApiMessage(user.id, server, numberOfPlayers, playersList),
        );
      }),
    );
  }

  private initializeClient(): void {
    this.logger.info(`Initializing client.`);
    this.client = new Client({
      partials: [Partials.User, Partials.Channel, Partials.Reaction],
      intents: ['Guilds', 'GuildMessages'],
    });
  }

  private async login(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.client.once(Events.ClientReady, (client) => {
          this.logger.info(
            `Discord bot is ready. Logged as: ${client.user.tag}`,
          );
          resolve();
        });
      } catch (error: unknown) {
        reject(error as Error);
      }
    }).catch(() => {
      this.logger.error('Could not login. Trying again.');

      void this.login();
    });
  }

  private subscribeToReceivedMessages(): void {
    this.client.on(Events.MessageCreate, (message) => {
      if (message.author.bot) {
        return;
      }

      const user = this.recipientIds.find((id) => id === message.author.id);

      if (!user) {
        this.addRecipient(message.author.id);
      }

      const name = message.author.globalName;

      message.author
        .send(
          `Hello ${name} ${WAVING_HAND_EMOJI}! I will notify you if new players join the MC servers ${THUMBS_UP_EMOJI}`,
        )
        .then(noop)
        .catch((error: unknown) => {
          this.logger.error(
            `Could not send message to ${name}`,
            ...(error as object[]),
          );

          void this.login();
        });
    });
  }

  private addRecipients(ids: string[]): void {
    for (const id of ids) {
      this.addRecipient(id);
    }
  }

  private addRecipient(id: string): void {
    this.logger.info(`Adding recipient with ID: ${id}`);
    this.recipientIds.push(id);
  }

  private addPendingMessage(message: DiscordApiMessage): void {
    const id = message.getId();
    const currentPendingMessages = this.pendingMessages.getValue();
    const found = currentPendingMessages.find(
      (item) => item.getId() === id,
    );

    if (!found) {
      this.logger.info(`Adding message to queue: ${id}`);
      this.pendingMessages.next([...currentPendingMessages, message]);
    }
  }

  private subscribeToPendingMessages(): void {
    this.subscription.add(
      this.pendingMessages
        .asObservable()
        .pipe(debounceTime(MESSAGE_TO_SEND_DEBOUNCE_TIME))
        .subscribe((messages) => {
          Promise.all(
            messages.map(
              async (message) => {
                  const recipientId = message.getRecipientId();

                  return this.fetchUserUntilSuccess(recipientId).then(
                    async (user) => this.sendMessageUntilSuccess(user, message),
                  );
              }
            ),
          ).then(() => {
            this.pendingMessages.next(
              this.pendingMessages
                .getValue()
                .filter(
                  (item) =>
                    !messages
                      .map((message) => message.getId())
                      .includes(item.getId()),
                ),
            );
          }).catch((error: unknown) => {
            this.logger.error(`Error while processing pending messages`, error);
            void this.login();
          });
        }),
    );
  }

  private async fetchUserUntilSuccess(userId: string): Promise<User> {
    const f = async (): Promise<User> => {
      let user: User | undefined;

      try {
        user = await this.client.users.fetch(userId);
      } catch {
        this.logger.error(`Could not fetch user with ID ${userId}`);
        void this.login();
      }

      return user ?? await f();
    };

    return f();
  }

  private async sendMessageUntilSuccess(
    user: User,
    message: DiscordApiMessage,
  ): Promise<void> {
    this.logger.info(`Sending message ${message.getId()} to user: ${user.id}`);

    const f = async (): Promise<void> => {
      try {
        await user.send(message.getMessage());
      } catch {
        this.logger.error(
          `Error while sending message ${message.getId()} to user: ${user.id}. Trying again.`,
        );

        await f();
      }
    };

    await f();

    this.logger.info(
      `Message ${message.getId()} successfully sent to user: ${user.id}`,
    );
  }
}
