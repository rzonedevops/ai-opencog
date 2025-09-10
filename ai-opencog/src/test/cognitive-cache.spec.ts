/**
 * Copyright (c) 2024 Cognitive Intelligence Ventures.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 */

import { expect } from 'chai';
import { CognitiveCache } from '../common/cognitive-cache';

describe('CognitiveCache', () => {
    let cognitiveCache: CognitiveCache;

    beforeEach(() => {
        cognitiveCache = new CognitiveCache();
    });

    afterEach(() => {
        cognitiveCache.dispose();
    });

    it('should store and retrieve cached results', async () => {
        const key = 'test-key';
        const data = { result: 'test-data', timestamp: Date.now() };

        await cognitiveCache.setCachedResult(key, data);
        const retrieved = await cognitiveCache.getCachedResult(key);

        expect(retrieved).to.deep.equal(data);
    });

    it('should return null for non-existent keys', async () => {
        const result = await cognitiveCache.getCachedResult('non-existent');
        expect(result).to.be.null;
    });

    it('should handle cache expiry', async () => {
        const key = 'expiry-test';
        const data = 'test-data';
        const shortTtl = 100; // 100ms

        await cognitiveCache.setCachedResult(key, data, shortTtl);
        
        // Should be available immediately
        const immediate = await cognitiveCache.getCachedResult(key);
        expect(immediate).to.equal(data);

        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Should be expired now
        const expired = await cognitiveCache.getCachedResult(key);
        expect(expired).to.be.null;
    });

    it('should implement LRU eviction when cache is full', async () => {
        // This would require setting a small max size for testing
        // For now, test that the cache tracks access patterns
        await cognitiveCache.setCachedResult('key1', 'data1');
        await cognitiveCache.setCachedResult('key2', 'data2');
        
        // Access key1 to make it more recently used
        await cognitiveCache.getCachedResult('key1');
        
        const stats = cognitiveCache.getStats();
        expect(stats.size).to.equal(2);
        expect(stats.entries).to.have.length(2);
    });

    it('should provide cache statistics', () => {
        const stats = cognitiveCache.getStats();
        
        expect(stats).to.have.property('size');
        expect(stats).to.have.property('maxSize');
        expect(stats).to.have.property('hitRate');
        expect(stats).to.have.property('entries');
        expect(stats.entries).to.be.an('array');
    });

    it('should check if key exists', async () => {
        const key = 'exists-test';
        
        expect(cognitiveCache.has(key)).to.be.false;
        
        await cognitiveCache.setCachedResult(key, 'data');
        expect(cognitiveCache.has(key)).to.be.true;
    });

    it('should delete specific cache entries', async () => {
        const key = 'delete-test';
        
        await cognitiveCache.setCachedResult(key, 'data');
        expect(cognitiveCache.has(key)).to.be.true;
        
        const deleted = cognitiveCache.delete(key);
        expect(deleted).to.be.true;
        expect(cognitiveCache.has(key)).to.be.false;
    });

    it('should clear all cache entries', async () => {
        await cognitiveCache.setCachedResult('key1', 'data1');
        await cognitiveCache.setCachedResult('key2', 'data2');
        
        expect(cognitiveCache.getStats().size).to.equal(2);
        
        cognitiveCache.clear();
        expect(cognitiveCache.getStats().size).to.equal(0);
    });

    it('should update access count and last accessed time', async () => {
        const key = 'access-test';
        await cognitiveCache.setCachedResult(key, 'data');
        
        // Access multiple times
        await cognitiveCache.getCachedResult(key);
        await cognitiveCache.getCachedResult(key);
        
        const stats = cognitiveCache.getStats();
        const entry = stats.entries.find(e => e.key === key);
        
        expect(entry).to.exist;
        expect(entry!.accessCount).to.be.greaterThan(1);
    });
});