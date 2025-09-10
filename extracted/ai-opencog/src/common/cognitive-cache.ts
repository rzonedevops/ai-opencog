/**
 * Copyright (c) 2024 Cognitive Intelligence Ventures.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 */

import { injectable } from '@theia/core/shared/inversify';

export interface CacheEntry {
    data: any;
    timestamp: number;
    expiry: number;
    accessCount: number;
    lastAccessed: number;
}

/**
 * Cognitive cache implementation for storing reasoning results, learning patterns, and other cognitive data
 */
@injectable()
export class CognitiveCache {
    private cache = new Map<string, CacheEntry>();
    private readonly defaultTtl: number = 300000; // 5 minutes default TTL
    private readonly maxSize: number = 1000;
    private readonly cleanupInterval: number = 60000; // 1 minute cleanup interval
    private cleanupTimer?: NodeJS.Timeout;

    constructor() {
        this.startCleanupTimer();
    }

    /**
     * Get cached result by key
     */
    async getCachedResult(key: string): Promise<any> {
        const entry = this.cache.get(key);
        if (entry && !this.isExpired(entry)) {
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            return entry.data;
        }
        
        // Remove expired entry
        if (entry) {
            this.cache.delete(key);
        }
        
        return null;
    }

    /**
     * Store result in cache with optional TTL
     */
    async setCachedResult(key: string, data: any, ttl?: number): Promise<void> {
        const now = Date.now();
        const expiry = now + (ttl || this.defaultTtl);
        
        // If cache is full, remove least recently used entry
        if (this.cache.size >= this.maxSize) {
            this.evictLeastRecentlyUsed();
        }

        this.cache.set(key, {
            data,
            timestamp: now,
            expiry,
            accessCount: 1,
            lastAccessed: now
        });
    }

    /**
     * Check if cache entry has expired
     */
    private isExpired(entry: CacheEntry): boolean {
        return Date.now() > entry.expiry;
    }

    /**
     * Remove least recently used entry
     */
    private evictLeastRecentlyUsed(): void {
        let oldestKey: string | undefined;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestKey = key;
                oldestTime = entry.lastAccessed;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.cleanupInterval);
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        entries: Array<{ key: string; accessCount: number; age: number; }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            accessCount: entry.accessCount,
            age: now - entry.timestamp
        }));

        const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
        const hitRate = totalAccesses > 0 ? totalAccesses / (totalAccesses + this.cache.size) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate,
            entries
        };
    }

    /**
     * Check if key exists in cache and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        return entry !== undefined && !this.isExpired(entry);
    }

    /**
     * Remove specific cache entry
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Dispose cleanup timer
     */
    dispose(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
    }
}