<h1 align="center">⛏️ Minecraft Server Status Notifier</h1>

<p align="center">
  <img src="https://raw.githubusercontent.com/ChrisAraneo/minecraft-server-status-notifier/refs/heads/master/logo.png" alt="Minecraft Server Status Notifier logo" width="506px" height="144px"/>
  <br>
  <a href="https://github.com/ChrisAraneo/minecraft-server-status-notifier/blob/master/package.json"><img src="https://img.shields.io/badge/version-v0.5.4-blue" alt="version"></a>
  <a href="https://github.com/ChrisAraneo/minecraft-server-status-notifier/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Minecraft Server Status Notifier is released under the MIT license."></a>
  <a href="https://github.com/ChrisAraneo/minecraft-server-status-notifier/actions/workflows/node.js.yml"><img alt="GitHub CI Status" src="https://img.shields.io/github/actions/workflow/status/ChrisAraneo/minecraft-server-status-notifier/node.js.yml?label=CI&logo=GitHub"></a>
  <br>
  <br>
  <em>Get notified on Discord when someone joins your Minecraft server</em>
  <br>
</p>

## ❓ Motivation

The purpose of this script is to notify the server administrator about the players on the server. The current version supports sending direct messages via Discord. The script was created to address the author's personal needs.

## ⚙️ Configuration file

Before running the application, fill in the values in the `src/config.json` configuration file (this file will be copied into `dist/src/config.json` when the script starts).

### 👉 Example `config.json`

```json
{
  "servers": ["abc.com", "minikraft.example"],
  "interval": 60000,
  "discord": true,
  "log-level": "debug",
  "cache-ttl": 30000,
  "recipients": [],
}
```

### 💬 Explanation

- **`servers` - list of servers you want to track**
- **`interval` - time interval (in milliseconds) between updates of the number of players; sixty seconds is usually enough**
- **`discord` - set to `true` to enable Discord notifications; set to `false` to disable them** (if you are using the Discord bot, remember to provide the `DISCORD_TOKEN` environment variable; more info below)
- `log-level` - severity level of logs you want to see (you can leave it on debug)
- `cache-ttl` - time after which the cache expires (should be lower than `interval`)
- `recipients` - predefined Discord recipients (IDs of users); if you want the bot to know the recipients of notification messages, you can fill in this list

Note: The most important parameters are highlighted in bold.

## 🔑 Discord token

If you want notifications to be sent via Discord, **you must provide the `DISCORD_TOKEN` environment variable** and also set the `discord` value in the configuration file to `true`.

You can obtain a Discord token by creating a Discord bot first (see the next chapter).

## 🤖 How to use Discord Bot

1. Create a bot instance on [https://discord.com/developers/applications].
2. Invite the bot to your Discord server.
3. `@mention` the bot in the server chat - after a successful mention, the bot should send you a hello message and will notify you from that moment onward.

## 🖥️ Running script from the command line

```bash
npm install
```

```bash
# Example for Linux: setting the environment variable before running the script
DISCORD_TOKEN=YOURTOKENHERE npm run start
```

## 🐋 Running script with Docker

```bash
# Build the Docker image
docker build --build-arg DISCORD_TOKEN="YOURTOKENHERE" -t mssn .
```

```bash
# Create and run the Docker container
docker run mssn
```

Warning: the current version of the Dockerfile will store your Discord token in the image. Be careful and don't leak your token.

## 📜 License

This project is [MIT licensed](LICENSE).
The project logo is [CC0 1.0 Deed licensed](https://creativecommons.org/publicdomain/zero/1.0/deed.en). The logo contains a [modified image made by JohannPoufPouf](https://openverse.org/image/93f54523-5ce1-469a-9cf6-531f0ca8b6ea).
