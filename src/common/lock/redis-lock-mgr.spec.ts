import { Test, TestingModule } from '@nestjs/testing';
import { RedisLockManager } from './redis-lock-mgr';
import { RedisRepository } from '../../database/redis/redis.repository';
import { mock, MockProxy } from 'jest-mock-extended';

describe('RedisLockManager', () => {
  let lockManager: RedisLockManager;
  let redisRepositoryMock: MockProxy<RedisRepository>;

  beforeEach(async () => {
    redisRepositoryMock = mock<RedisRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisLockManager,
        {
          provide: RedisRepository,
          useValue: redisRepositoryMock,
        },
      ],
    }).compile();

    lockManager = module.get<RedisLockManager>(RedisLockManager);
  });

  it('should wait for turn in queue', async () => {
    const resourceId = 'test-resource';
    const operation = jest.fn().mockResolvedValue('operation result');

    redisRepositoryMock.rpush.mockResolvedValue(2);
    redisRepositoryMock.lrange
      .mockResolvedValueOnce(['other-request', 'request-id'])
      .mockResolvedValueOnce(['request-id']);
    redisRepositoryMock.setnx.mockResolvedValue(true);
    redisRepositoryMock.get.mockResolvedValue('request-id');

    const result = await lockManager.withLock(resourceId, operation);

    expect(result).toBe('operation result');
    expect(redisRepositoryMock.lrange).toHaveBeenCalledTimes(2);
  });

  it('should retry acquiring lock', async () => {
    const resourceId = 'test-resource';
    const operation = jest.fn().mockResolvedValue('operation result');

    redisRepositoryMock.rpush.mockResolvedValue(1);
    redisRepositoryMock.lrange.mockResolvedValue(['request-id']);
    redisRepositoryMock.setnx
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    redisRepositoryMock.get.mockResolvedValue('request-id');

    const result = await lockManager.withLock(resourceId, operation);

    expect(result).toBe('operation result');
    expect(redisRepositoryMock.setnx).toHaveBeenCalledTimes(3);
  });

  it('should throw error if lock acquisition fails after max retries', async () => {
    const resourceId = 'test-resource';
    describe('RedisLockManager', () => {
      let redisLockManager: RedisLockManager;
      let mockRedisRepository: jest.Mocked<RedisRepository>;
    
      beforeEach(async () => {
        mockRedisRepository = {
          rpush: jest.fn(),
          lrange: jest.fn(),
          lrem: jest.fn(),
          setnx: jest.fn(),
          get: jest.fn(),
          del: jest.fn(),
          publish: jest.fn(),
          createSubscriber: jest.fn(),
        } as any;
    
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            RedisLockManager,
            {
              provide: RedisRepository,
              useValue: mockRedisRepository,
            },
          ],
        }).compile();
    
        redisLockManager = module.get<RedisLockManager>(RedisLockManager);
      });
    
      it('should be defined', () => {
        expect(redisLockManager).toBeDefined();
      });
    
      describe('withLock', () => {
        it('should acquire lock, execute operation, and release lock', async () => {
          const resourceId = 'test-resource';
          const operation = jest.fn().mockResolvedValue('operation result');
    
          mockRedisRepository.rpush.mockResolvedValue(1);
          mockRedisRepository.lrange.mockResolvedValue(['test-uuid']);
          mockRedisRepository.setnx.mockResolvedValue(true);
          mockRedisRepository.get.mockResolvedValue('test-uuid');
    
          const result = await redisLockManager.withLock(resourceId, operation);
    
          expect(result).toBe('operation result');
          expect(operation).toHaveBeenCalledTimes(1);
          expect(mockRedisRepository.rpush).toHaveBeenCalled();
          expect(mockRedisRepository.lrange).toHaveBeenCalled();
          expect(mockRedisRepository.setnx).toHaveBeenCalled();
          expect(mockRedisRepository.get).toHaveBeenCalled();
          expect(mockRedisRepository.del).toHaveBeenCalled();
          expect(mockRedisRepository.lrem).toHaveBeenCalled();
          expect(mockRedisRepository.publish).toHaveBeenCalled();
        });
    
        
      });
    });

    redisRepositoryMock.rpush.mockResolvedValue(1);
    redisRepositoryMock.lrange.mockResolvedValue(['request-id']);
    redisRepositoryMock.setnx.mockResolvedValue(false);

    await expect(lockManager.withLock(resourceId, () =>  Promise.resolve())).rejects.toThrow('Failed to acquire lock after max retries');
  });

  it('should handle concurrent lock requests', async () => {
    const resourceId = 'test-resource';
    const operation1 = jest.fn().mockResolvedValue('result1');
    const operation2 = jest.fn().mockResolvedValue('result2');

    let queue = ['request-id-1', 'request-id-2'];
    redisRepositoryMock.rpush.mockImplementation(async (key, value) => {
      queue.push(value);
      return queue.length;
    });
    redisRepositoryMock.lrange.mockImplementation(async () => queue);
    redisRepositoryMock.lrem.mockImplementation(async (key, count, value) => {
      queue = queue.filter(item => item !== value);
      return 1;
    });
    redisRepositoryMock.setnx.mockResolvedValue(true);
    redisRepositoryMock.get.mockResolvedValue('request-id');

    const promise1 = lockManager.withLock(resourceId, operation1);
    const promise2 = lockManager.withLock(resourceId, operation2);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe('result1');
    expect(result2).toBe('result2');
    expect(operation1).toHaveBeenCalledTimes(1);
    expect(operation2).toHaveBeenCalledTimes(1);
  });
});