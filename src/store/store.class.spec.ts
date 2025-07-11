import { firstValueFrom } from 'rxjs';

import { Store } from './store.class';

const DUMMY_STATUSES = [
  {
    server: '0.0.0.0',
    online: 1,
    players: [
      {
        uuid: '6f9ca9ab-8f38-4cd8-a858-f8f2b950598a',
        name: 'John',
      },
    ],
  },
  {
    server: '1.1.1.1',
    online: 0,
    players: [],
  },
  {
    server: '2.2.2.2',
    online: 2,
    players: [
      {
        uuid: '5a755c70-c39a-4811-a259-4e5aca7bdea7',
        name: 'Adam',
      },
      {
        uuid: '3af98ee8-16a4-4edb-9261-feb924a47d90',
        name: 'Beth',
      },
    ],
  },
];

describe('Store', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  describe('getServerStatus', () => {
    it('should return null when status was not added before', async () => {
      const result = await firstValueFrom(store.getServerStatus('2.2.2.2'));

      expect(result).toStrictEqual(null);
    });

    it('should return status if it was added before', async () => {
      store.updateServerStatus(DUMMY_STATUSES[1]);
      store.updateServerStatus(DUMMY_STATUSES[2]);

      const result = await firstValueFrom(store.getServerStatus('2.2.2.2'));

      expect(result).toStrictEqual(DUMMY_STATUSES[2]);
    });

    it('should return different result when status was upated', async () => {
      store.updateServerStatus(DUMMY_STATUSES[0]);

      store.updateServerStatus({
        ...DUMMY_STATUSES[0],
        online: 0,
        players: [],
      });
      const result = await firstValueFrom(store.getServerStatus('0.0.0.0'));

      expect(result).toStrictEqual({
        ...DUMMY_STATUSES[0],
        online: 0,
        players: [],
      });
    });
  });

  describe('getServerStatuses', () => {
    it('should return empty array', async () => {
      const result = await firstValueFrom(store.getServerStatuses());

      expect(result).toStrictEqual([]);
    });

    it('should return array with three items if they were added before', async () => {
      store.updateServerStatus(DUMMY_STATUSES[0]);
      store.updateServerStatus(DUMMY_STATUSES[1]);
      store.updateServerStatus(DUMMY_STATUSES[2]);

      const result = await firstValueFrom(store.getServerStatuses());

      expect(result).toStrictEqual([
        DUMMY_STATUSES[0],
        DUMMY_STATUSES[1],
        DUMMY_STATUSES[2],
      ]);
    });

    it('should return different result when status was upated', async () => {
      store.updateServerStatus(DUMMY_STATUSES[0]);
      store.updateServerStatus(DUMMY_STATUSES[1]);
      store.updateServerStatus(DUMMY_STATUSES[2]);

      store.updateServerStatus({
        ...DUMMY_STATUSES[0],
        online: 0,
        players: [],
      });
      const result = await firstValueFrom(store.getServerStatuses());

      expect(result).toStrictEqual([
        {
          ...DUMMY_STATUSES[0],
          online: 0,
          players: [],
        },
        DUMMY_STATUSES[1],
        DUMMY_STATUSES[2],
      ]);
    });
  });
});
