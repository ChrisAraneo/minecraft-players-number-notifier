import { isEqual } from 'lodash';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { Player } from '../models/player.interface';
import { ServerStatus } from '../models/server-status.interface';

export class Store {
  private readonly store = new BehaviorSubject<ServerStatus[]>([]);

  getServerStatuses(): Observable<ServerStatus[]> {
    return this.store.asObservable();
  }

  getServerStatus(server: string): Observable<ServerStatus | null> {
    return this.store.asObservable().pipe(
      map((statuses) => statuses.filter((item) => item.server === server)),
      map((item) => (Array.isArray(item) ? item[0] : item)),
      map((item) => item || null),
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

    if (Boolean(current.players) && Boolean(previous.players)) {
      const currentPlayers = [...current.players];
      const previousPlayers = [...current.players];

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
