import { OfflineDatabase } from './OfflineDatabase';
import { OfflineQueryPersistence } from './OfflineQueryPersistence';
import { OfflineRepository } from './OfflineRepository';
import { OfflineSyncService } from './OfflineSyncService';

export const offlineDatabase = new OfflineDatabase();
export const offlineRepository = new OfflineRepository(offlineDatabase);
export const offlineQueryPersistence = new OfflineQueryPersistence(offlineRepository);
export const offlineSyncService = new OfflineSyncService(offlineRepository);
