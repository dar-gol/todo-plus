export type OfflineSyncResult = {
  error: string | null;
  pendingCount: number;
  transientFailure: boolean;
};
