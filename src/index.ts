/* eslint-disable unicorn/prefer-top-level-await */

import { MinecraftServerStatusNotifier } from './minecraft-server-status-notifier.class';

const APP = new MinecraftServerStatusNotifier();

void APP.initialize().then(() => APP.run());
