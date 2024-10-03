export interface ILockManager {
    withLock<T>(resourceId: string, operation: () => Promise<T>): Promise<T>;
}
