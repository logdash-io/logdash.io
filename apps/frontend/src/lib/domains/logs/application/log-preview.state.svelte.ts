import type { Log } from '../domain/log.js';

class LogPreviewState {
  private _selectedLog = $state<Log | null>(null);
  private _logs: Log[] = [];
  private _sameTypeLogsCache: Log[] = [];
  private _currentIndexInSameTypeCache = $state<number>(-1);
  private _currentIndexInAllLogs = $state<number>(-1);
  private _sameTypeCount = $state<number>(0);

  get selectedLog(): Log | null {
    return this._selectedLog;
  }

  get isOpen(): boolean {
    return this._selectedLog !== null;
  }

  get currentIndex(): number {
    return this._currentIndexInAllLogs;
  }

  get sameTypeLogs(): Log[] {
    return this._sameTypeLogsCache;
  }

  get currentIndexInSameType(): number {
    return this._currentIndexInSameTypeCache;
  }

  get sameTypeLogsCount(): number {
    return this._sameTypeCount;
  }

  get hasPrevSameType(): boolean {
    return this._currentIndexInSameTypeCache > 0;
  }

  get hasNextSameType(): boolean {
    return (
      this._currentIndexInSameTypeCache >= 0 &&
      this._currentIndexInSameTypeCache < this._sameTypeCount - 1
    );
  }

  setLogs(logs: Log[]): void {
    this._logs = logs;
    if (this._selectedLog) {
      this._updateCaches();
    }
  }

  open(log: Log): void {
    this._selectedLog = log;
    this._updateCaches();
  }

  close(): void {
    this._selectedLog = null;
    this._sameTypeLogsCache = [];
    this._currentIndexInSameTypeCache = -1;
    this._currentIndexInAllLogs = -1;
    this._sameTypeCount = 0;
  }

  toggle(log: Log): void {
    if (this._selectedLog?.id === log.id) {
      this.close();
    } else {
      this.open(log);
    }
  }

  goToPrevSameType(): void {
    const currentIndex = this._currentIndexInSameTypeCache;
    if (currentIndex <= 0) return;

    const prevLog = this._sameTypeLogsCache[currentIndex - 1];
    if (prevLog) {
      this._selectedLog = prevLog;
      this._currentIndexInSameTypeCache = currentIndex - 1;
    }
  }

  goToNextSameType(): void {
    const currentIndex = this._currentIndexInSameTypeCache;
    if (currentIndex < 0 || currentIndex >= this._sameTypeCount - 1) {
      return;
    }

    const nextLog = this._sameTypeLogsCache[currentIndex + 1];
    if (nextLog) {
      this._selectedLog = nextLog;
      this._currentIndexInSameTypeCache = currentIndex + 1;
    }
  }

  private _updateCaches(): void {
    if (!this._selectedLog) {
      this._sameTypeLogsCache = [];
      this._currentIndexInSameTypeCache = -1;
      this._currentIndexInAllLogs = -1;
      this._sameTypeCount = 0;
      return;
    }

    const selectedLevel = this._selectedLog.level;
    const selectedId = this._selectedLog.id;

    this._currentIndexInAllLogs = this._logs.findIndex(
      (l) => l.id === selectedId,
    );
    this._sameTypeLogsCache = this._logs.filter(
      (l) => l.level === selectedLevel,
    );
    this._sameTypeCount = this._sameTypeLogsCache.length;
    this._currentIndexInSameTypeCache = this._sameTypeLogsCache.findIndex(
      (l) => l.id === selectedId,
    );
  }
}

export const logPreviewState = new LogPreviewState();
