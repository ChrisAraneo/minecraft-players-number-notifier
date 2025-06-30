import { Logger } from '@chris.araneo/logger';
import { Client, Events, Partials, User } from 'discord.js';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';

import { Config } from '../models/config.type';
import { Player } from '../models/player.interface';
import { DiscordApiMessage } from './discord-api-message.class';

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
    private readonly token: string,
    recipientIds: string[] = [],
  ) {
    if (this.config.discord) {
      this.logger.info(`Discord bot is enabled.`);

      this.initializeClient();
      this.addRecipients(recipientIds);
      this.login().then(() => {
              this.subscribeToReceivingMessages();
      this.subscribeToMessagesToSend();
      }).catch((error: unknown) => {
        this.logger.error('Error during DiscordApiClient initialization', error);
      })
    }
  }

  sendMessage(
    server: string,
    numberOfPlayers: number,
    playersList: Player[],
  ): void {
    this.recipientIds.forEach(async (id) => {
      let user: User | undefined;

      while (!user) {
        try {
          user = await this.client.users.fetch(id);
        } catch {
          this.logger.error(`Could not fetch user with ID ${id}`);
          this.login();
        }
      }

      this.pushMessageToSend(
        new DiscordApiMessage(user.id, server, numberOfPlayers, playersList),
      );
    });
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
      } catch (error) {
        reject(error);
      }
    }).catch(() => {
      this.logger.error('Could not login. Trying again.');
      this.login();
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
      const wavingHandEmoji = String.fromCodePoint(0x1_F4_4B);
      const thumbsUpEmoji = String.fromCodePoint(0x1_F4_4D);

      message.author
        .send(
          `Hello ${name} ${wavingHandEmoji}! I will notify you if new players join the MC servers ${thumbsUpEmoji}`,
        )
        .then(() => {})
        .catch((error: unknown) => {
          this.logger.error(`Could not send message to ${name}`, ...error);
          this.login();
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
        .pipe(debounceTime(1000))
        .subscribe((messages) => {
          Promise.all(
            messages.map(
              async (message) =>
                // eslint-disable-next-line no-async-promise-executor
                new Promise<void>(async (resolve) => {
                  const recipientId = message.getRecipientId();
                  let user: User | undefined;

                  while (!user) {
                    try {
                      user = await this.client.users.fetch(recipientId);
                    } catch {
                      this.logger.error(
                        `Could not fetch user with ID ${recipientId}`,
                      );
                      this.login();
                    }
                  }

                  this.logger.info(
                    `Sending message ${message.getId()} to user: ${user.id}`,
                  );

                  let isMessageSuccessfullySent = false;

                  while (!isMessageSuccessfullySent) {
                    try {
                      await user.send(message.getMessage()).then(() => {
                        isMessageSuccessfullySent = true;
                      });
                    } catch {
                      this.logger.error(
                        `Error while sending message ${message.getId()} to user: ${
                          user.id
                        }. Trying again.`,
                      );
                      isMessageSuccessfullySent = false;
                    }
                  }

                  this.logger.info(
                    `Message ${message.getId()} successfully sent to user: ${
                      user.id
                    }`,
                  );

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
                      .find((id) => id === item.getId()),
                ),
            );
          });
        }),
    );
  }
}
