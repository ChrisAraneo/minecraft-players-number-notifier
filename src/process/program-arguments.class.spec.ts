import { DISCORD_TOKEN, RECIPIENTS } from './argument-keys.consts';
import { Process } from './process.class';
import { ProcessMock } from './process.mock.class';
import { ProgramArguments } from './program-arguments.class';

describe('ProgramArguments', () => {
  let process: Process;
  let programArguments: ProgramArguments;

  beforeEach(() => {
    process = new ProcessMock();
    programArguments = new ProgramArguments(process);
  });

  describe('load', () => {
    it('should return list of arguments when program executed with valid arguments', async () => {
      const args = programArguments.load();

      expect(args).toStrictEqual([
        {
          key: DISCORD_TOKEN,
          value: '01234543210',
        },
        {
          key: RECIPIENTS,
          value: ['rec1', 'rec2', 'rec3'],
        },
      ]);
    });
  });
});
