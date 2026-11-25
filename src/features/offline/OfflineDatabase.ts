import Dexie, { type EntityTable } from 'dexie';
import type { OfflineMutation } from './OfflineMutation';
import type { OfflineQuerySnapshot } from './OfflineQuerySnapshot';

/** Stores user-scoped query snapshots and replayable mutations on the device. */
export class OfflineDatabase extends Dexie {
  mutations!: EntityTable<OfflineMutation, 'sequence'>;
  snapshots!: EntityTable<OfflineQuerySnapshot, 'key'>;

  constructor(name = 'todo-plus-offline') {
    super(name);
    this.version(1).stores({
      mutations: '++sequence,&id,userId,state,createdAt,[userId+sequence]',
      snapshots: '&key,userId,updatedAt'
    });
  }
}
