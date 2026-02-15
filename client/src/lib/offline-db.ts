import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface KizereOfflineDB extends DBSchema {
    'pending-syncs': {
        key: string;
        value: {
            id: string;
            type: 'CREATE_ITEM' | 'CREATE_REPORT' | 'SEND_MESSAGE';
            data: any;
            timestamp: number;
            retryCount: number;
        };
        indexes: { 'by-timestamp': number };
    };
}

let dbPromise: Promise<IDBPDatabase<KizereOfflineDB>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<KizereOfflineDB>('kizere-offline', 1, {
            upgrade(db) {
                const store = db.createObjectStore('pending-syncs', {
                    keyPath: 'id',
                });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }
    return dbPromise;
};

export class OfflineSyncService {
    static async queue(type: 'CREATE_ITEM' | 'CREATE_REPORT' | 'SEND_MESSAGE', data: any) {
        const db = await getDB();
        const id = crypto.randomUUID();

        await db.add('pending-syncs', {
            id,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        });

        // Register for background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            try {
                await (registration as any).sync.register('sync-kizere-data');
                console.log('[OfflineSync] Registered background sync');
            } catch (err) {
                console.error('[OfflineSync] Background sync registration failed', err);
            }
        }

        return id;
    }

    static async getAllPending() {
        const db = await getDB();
        return db.getAllFromIndex('pending-syncs', 'by-timestamp');
    }

    static async remove(id: string) {
        const db = await getDB();
        await db.delete('pending-syncs', id);
    }

    static async incrementRetry(id: string) {
        const db = await getDB();
        const item = await db.get('pending-syncs', id);
        if (item) {
            item.retryCount++;
            await db.put('pending-syncs', item);
        }
    }
}
