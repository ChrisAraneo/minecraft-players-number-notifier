/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { Logger } from '@chris.araneo/logger';
import { Client, Events, Partials, User } from 'discord.js';
import { noop } from 'lodash';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';

import { Config } from '../models/config.type';
import { Player } from '../models/player.interface';
import { MESSAGE_TO_SEND_DEBOUNCE_TIME } from './discord-api-client.consts';
import { DiscordApiMessage } from './discord-api-message.class';
import { THUMBS_UP_EMOJI, WAVING_HAND_EMOJI } from './emoji.consts';

export class DiscordApiClient {
  private client!: Client;
  private readonly recipientIds: string[] = [];
  private readonly messagesToSend = new BehaviorSubject<DiscordApiMessage[]>(
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
          this.subscribeToReceivingMessages();
          this.subscribeToMessagesToSend();
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

        this.pushMessageToSend(
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

  private subscribeToReceivingMessages(): void {
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

  private pushMessageToSend(message: DiscordApiMessage): void {
    const currentMessages = this.messagesToSend.getValue();
    const found = currentMessages.find(
      (item) => item.getId() === message.getId(),
    );

    if (!found) {
      this.logger.info(`Adding message to queue: ${message.getId()}`);
      this.messagesToSend.next([...currentMessages, message]);
    }
  }

  private subscribeToMessagesToSend(): void {
    this.subscription.add(
      this.messagesToSend
        .asObservable()
        .pipe(debounceTime(MESSAGE_TO_SEND_DEBOUNCE_TIME))
        .subscribe((messages) => {
          Promise.all(
            messages.map(
              async (message) =>
                new Promise<void>(async (resolve) => {
                  const recipientId = message.getRecipientId();

                  const user = await this.fetchUserUntilSuccess(recipientId);

                  await this.sendMessageUntilSuccess(user, message);

                  resolve();
                }),
            ),
          ).then(() => {
            this.messagesToSend.next(
              this.messagesToSend
                .getValue()
                .filter(
                  (item) =>
                    !messages
                      .map((message) => message.getId())
                      .includes(item.getId()),
                ),
            );
          });
        }),
    );
  }

  private async fetchUserUntilSuccess(userId: string): Promise<User> {
    const fetchUserWithRetry = async (): Promise<User> => {
      let user: User | undefined;

      try {
        user = await this.client.users.fetch(userId);
      } catch {
        this.logger.error(`Could not fetch user with ID ${userId}`);
        void this.login();
      }

      return user ?? await fetchUserWithRetry();
    };

    return fetchUserWithRetry();
  }

  private async sendMessageUntilSuccess(
    user: User,
    message: DiscordApiMessage,
  ): Promise<void> {
    this.logger.info(`Sending message ${message.getId()} to user: ${user.id}`);

    const sendMessageWithRetry = async (): Promise<void> => {
      try {
        await user.send(message.getMessage());
      } catch {
        this.logger.error(
          `Error while sending message ${message.getId()} to user: ${user.id}. Trying again.`,
        );

        await sendMessageWithRetry();
      }
    };

    await sendMessageWithRetry();

    this.logger.info(
      `Message ${message.getId()} successfully sent to user: ${user.id}`,
    );
  }
}
