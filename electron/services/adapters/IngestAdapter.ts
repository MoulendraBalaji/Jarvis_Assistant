import { AdapterStatus } from "../../../shared/types";

export interface IngestAdapter {
  id: string;
  label: string;
  description: string;
  status: AdapterStatus;
  lastSyncAt: number | null;
  connect(): Promise<void>;
  reconnect(): Promise<void>;
  authorize(): Promise<void>;
  onHealthChange(cb: (status: AdapterStatus) => void): void;
}

export abstract class BaseAdapter implements IngestAdapter {
  abstract id: string;
  abstract label: string;
  abstract description: string;
  status: AdapterStatus = "unauthenticated";
  lastSyncAt: number | null = null;
  private cbs = new Set<(s: AdapterStatus) => void>();

  protected setStatus(status: AdapterStatus) {
    this.status = status;
    this.cbs.forEach((cb) => cb(status));
  }

  onHealthChange(cb: (s: AdapterStatus) => void) {
    this.cbs.add(cb);
  }

  abstract connect(): Promise<void>;
  abstract reconnect(): Promise<void>;
  abstract authorize(): Promise<void>;
}
