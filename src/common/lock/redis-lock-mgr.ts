import { Injectable } from '@nestjs/common';
import { ILockManager } from './lock-mgr.interface';
import { RedisRepository } from '../../database/redis/redis.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedisLockManager implements ILockManager {
    private readonly lockPrefix = 'lock:';
    private readonly queuePrefix = 'queue:';
    private readonly channelPrefix = 'channel:';
    private readonly defaultTTL = 30000; // 30 seconds
    private readonly maxRetries = 40;

    constructor(private readonly memoryDB: RedisRepository) {}

async withLock<T>(resourceId: string, operation: () => Promise<T>): Promise<T> {
        const lockResourceId = `lock:${resourceId}`;
        const lockKey = this.getLockKey(lockResourceId);
        const queueKey = this.getQueueKey(lockResourceId);
        const channelKey = this.getChannelKey(lockResourceId);
        const requestId = this.generateUniqueRequestId();
        
        
        try {
            await this.joinQueue(queueKey, requestId);
            console.log(`Joined queue for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.waitForTurn(queueKey, channelKey, requestId);
            console.log(`Turn arrived for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.acquireLock(lockKey, requestId);
            console.log(`Lock acquired for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            const result = await operation();
            console.log(`Operation completed for resource: ${lockResourceId}, requestId: ${requestId}`);
            return result;
        } catch (error) {
            console.log(`Error in withLock for resource: ${lockResourceId}, requestId: ${requestId}`, error.stack);
            throw error;
        } finally {
            await this.releaseLock(lockKey, requestId);
            console.log(`Lock released for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.leaveQueue(queueKey, requestId);
            console.log(`Left queue for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.notifyNext(channelKey);
            console.log(`Notified next in queue for resource: ${lockResourceId}`);
        }
    }

    private async joinQueue(queueKey: string, requestId: string): Promise<void> {
        await this.memoryDB.rpush(queueKey, requestId);
    }

    private generateUniqueRequestId(): string {
        return uuidv4();
    }

    private async waitForTurn(queueKey: string, channelKey: string, requestId: string): Promise<void> {
        while (true) {
            const queue = await this.memoryDB.lrange(queueKey, 0, 0);
            if (queue[0] === requestId) {
                console.log(`Turn arrived for requestId: ${requestId}`);
                return;
            }
            console.log(`Waiting for turn, requestId: ${requestId}`);
            await this.waitForNotification(channelKey);
        }
    }

    private async waitForNotification(channelKey: string): Promise<void> {
        return new Promise(async (resolve) => {
            const subscriber = await this.memoryDB.createSubscriber(channelKey);
            subscriber.subscribe(channelKey, (message) => {
                if (message === 'next') {
                    subscriber.unsubscribe(channelKey);
                    subscriber.quit();
                    resolve();
                }
            });
        });
    }

    private async leaveQueue(queueKey: string, requestId: string): Promise<void> {
        await this.memoryDB.lrem(queueKey, 1, requestId);
    }

    private async acquireLock(lockKey: string, requestId: string): Promise<void> {
        for (let i = 0; i < this.maxRetries; i++) {
            const acquired = await this.memoryDB.setnx(lockKey, requestId, this.defaultTTL);
            if (acquired) {
                console.log(`Lock acquired for requestId: ${requestId}`);
                return;
            }
            console.log(`Failed to acquire lock, retry ${i + 1}/${this.maxRetries} for requestId: ${requestId}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`Failed to acquire lock after max retries for requestId: ${requestId}`);
        throw new Error('Failed to acquire lock after max retries');
    }

    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        const currentLockHolder = await this.memoryDB.get(lockKey);
        if (currentLockHolder === requestId) {
            await this.memoryDB.del(lockKey);
        }
    }

    private async notifyNext(channelKey: string): Promise<void> {
        await this.memoryDB.publish(channelKey, 'next');
    }

    private getLockKey(resourceId: string): string {
        return `${this.lockPrefix}${resourceId}`;
    }

    private getQueueKey(resourceId: string): string {
        return `${this.queuePrefix}${resourceId}`;
    }

    private getChannelKey(resourceId: string): string {
        return `${this.channelPrefix}${resourceId}`;
    }
}