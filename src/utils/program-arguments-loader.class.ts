import process from 'node:process';
import { Argument } from './argument.type';
import { ArgumentKey } from './argument-key.type';
import { DISCORD_TOKEN, RECIPIENTS } from './argument-keys.consts';

export class ProgramArgumentsLoader {
    private arguments?: string[];

    constructor() {
        this.initialize();
    }

    load(): Argument[] {
        return this.arguments.map((argument) => {
            const parts = argument.split('=');

            if (parts.length > 1) {
                const key: string = parts[0];

                if (!this.isArgumentKeyValid(key)) {
                    throw Error('Argument has incorrect key.');
                }

                const valueParts = parts[1].split(';');

                return {
                    key: key,
                    value: valueParts.length > 1 ? valueParts : valueParts[0],
                };
            } else {
                throw Error('Incorrect program argument or no value passed.');
            }
        });
    }

    private initialize(): void {
        if (!this.arguments) {
            this.arguments = process.argv.slice(2, process.argv.length);
        }
    }

    private isArgumentKeyValid(key: string): key is ArgumentKey {
        return key === DISCORD_TOKEN || key === RECIPIENTS;
    }
}