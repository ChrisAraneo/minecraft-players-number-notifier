/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-statements */
/* eslint-disable @typescript-eslint/unbound-method */
import { isArray, isEmpty, isEqual } from 'lodash';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { Player } from '../models/player.interface';
import { ServerStatus } from '../models/server-status.interface';

export class Store {
  private readonly store = new BehaviorSubject<ServerStatus[]>([]);

  getServerStatuses(): Observable<ServerStatus[] | null> {
    return this.store.asObservable();
  }

  getServerStatus(server: string): Observable<ServerStatus | null> {
    return this.store.asObservable().pipe(
      map((statuses) => statuses.filter((item) => item.server === server)),
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      map((item) => (isArray(item) ? item[0] : item) || null),
    );
  }

  updateServerStatus(status: ServerStatus): void {
    const latestValue = [...this.store.getValue()];
    const index = latestValue.findIndex(
      (item) => item.server === status.server,
    );

    if (index === -1) {
      const updated = [...latestValue, status];
      updated.sort(this.compareByServer);

      this.store.next(updated);
    } else {
      const previous = latestValue[index];

      if (this.hasServerStatusChanged(status, previous)) {
        latestValue[index] = status;

        this.store.next(latestValue);
      }
    }
  }

  private hasServerStatusChanged(
    current: ServerStatus,
    previous: ServerStatus,
  ): boolean {
    if (current.online !== previous.online) {
      return true;
    }

    if (
      (Boolean(current.players) && !previous.players) ||
      (!current.players && Boolean(previous.players))
    ) {
      return true;
    }

    if (
      !isEmpty(current.players) &&
      isArray(current.players) &&
      !isEmpty(previous.players) &&
      isArray(previous.players)
    ) {
      const currentPlayers = [...current.players];
      const previousPlayers = [...previous.players];

      currentPlayers.sort(this.compareByUUID);
      previousPlayers.sort(this.compareByUUID);

      return !isEqual(currentPlayers, previousPlayers);
    }

    return true;
  }

  private compareByServer(a: ServerStatus, b: ServerStatus): number {
    return a.server.localeCompare(b.server);
  }

  private compareByUUID(a: Player, b: Player): number {
    return a.uuid.localeCompare(b.uuid);
  }
}
