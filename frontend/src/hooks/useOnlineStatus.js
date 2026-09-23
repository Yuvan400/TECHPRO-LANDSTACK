import { useState, useEffect, useCallback } from 'react';
import { getQueuedActions, removeQueuedAction } from '../services/indexedDbService';
import api from '../services/api';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const refreshQueueCount = useCallback(async () => {
    const queue = await getQueuedActions();
    setQueuedCount(queue.length);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = await getQueuedActions();
    if (queue.length === 0) {
      setQueuedCount(0);
      return;
    }

    setIsSyncing(true);
    let successCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'SUBMIT_APPLICATION') {
          await api.post('/api/applications', item.payload);
          await removeQueuedAction(item.id);
          successCount++;
        } else if (item.type === 'FIELD_VERIFICATION') {
          await api.post('/api/field/verification', item.payload);
          await removeQueuedAction(item.id);
          successCount++;
        }
      } catch (err) {
        console.error('Failed syncing queued item:', item, err);
        // Leave item in queue to retry
      }
    }

    await refreshQueueCount();
    setIsSyncing(false);
    return successCount;
  }, [refreshQueueCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue, refreshQueueCount]);

  return { isOnline, isSyncing, queuedCount, syncOfflineQueue, refreshQueueCount };
};
