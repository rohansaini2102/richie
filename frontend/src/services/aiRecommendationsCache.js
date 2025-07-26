// AI Recommendations Cache Service
// Provides persistent local storage for AI recommendations to prevent repeated API calls

class AIRecommendationsCache {
  constructor() {
    this.cacheKeyPrefix = 'ai_recommendations_';
    this.metadataKey = 'ai_cache_metadata';
    this.defaultExpiryHours = 24; // 24 hours default expiry
    this.maxCacheSize = 50; // Maximum number of cached recommendations
  }

  /**
   * Create a unique fingerprint for goals and client data combination
   * @param {Array} goals - Array of goal objects
   * @param {Object} clientData - Client data object
   * @returns {string} - Unique fingerprint string
   */
  createGoalsFingerprint(goals, clientData) {
    if (!goals || !clientData) {
      console.warn('🚫 [AICache] Missing data for fingerprint:', {
        hasGoals: !!goals,
        hasClientData: !!clientData,
        goalsLength: goals?.length || 0
      });
      return null;
    }

    // Create a stable hash from relevant goal data
    const goalsData = goals.map(goal => ({
      id: goal.id || 'no-id',
      title: goal.title || 'untitled',
      targetAmount: Math.round(goal.targetAmount || 0),
      targetYear: goal.targetYear || new Date().getFullYear() + 5,
      priority: goal.priority || 'Medium',
      monthlySIP: Math.round(goal.monthlySIP || 0),
      timeInYears: Math.round(goal.timeInYears || 5)
    })).sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    // Include relevant client data that affects recommendations
    const clientFingerprint = {
      id: clientData._id || clientData.id || 'no-client-id',
      totalMonthlyIncome: Math.round(clientData.totalMonthlyIncome || 0),
      totalMonthlyExpenses: Math.round(clientData.totalMonthlyExpenses || 0),
      riskTolerance: clientData.riskTolerance || 'Moderate',
      age: clientData.age || 30,
      // Include a hash of assets and debts without full details for privacy
      assetsHash: this.hashObject(clientData.assets || {}),
      debtsHash: this.hashObject(clientData.debtsAndLiabilities || {})
    };

    const combined = {
      goals: goalsData,
      client: clientFingerprint,
      version: 'v1.2' // Version for cache invalidation if structure changes
    };

    const fingerprint = this.hashObject(combined);
    
    console.log('🆔 [AICache] Created fingerprint:', {
      fingerprint: fingerprint.substring(0, 12) + '...',
      goalsCount: goalsData.length,
      clientId: clientFingerprint.id,
      goalsData: goalsData.map(g => ({ id: g.id, title: g.title, amount: g.targetAmount })),
      clientData: {
        income: clientFingerprint.totalMonthlyIncome,
        expenses: clientFingerprint.totalMonthlyExpenses,
        risk: clientFingerprint.riskTolerance
      }
    });

    return fingerprint;
  }

  /**
   * Create a simple hash of an object
   * @param {Object} obj - Object to hash
   * @returns {string} - Hash string
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save AI recommendations to localStorage
   * @param {Array} goals - Goals array
   * @param {Object} clientData - Client data
   * @param {Object} recommendations - AI recommendations
   * @param {number} expiryHours - Hours until expiry (optional)
   */
  saveRecommendations(goals, clientData, recommendations, expiryHours = this.defaultExpiryHours) {
    try {
      const fingerprint = this.createGoalsFingerprint(goals, clientData);
      if (!fingerprint) {
        console.warn('🚫 [AICache] Cannot create fingerprint, skipping cache save');
        return false;
      }

      const cacheKey = this.cacheKeyPrefix + fingerprint;
      const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);

      const cacheEntry = {
        fingerprint,
        recommendations,
        timestamp: Date.now(),
        expiryTime,
        goalsCount: goals.length,
        clientId: clientData._id || clientData.id,
        version: '1.1'
      };

      // Save the cache entry
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      // Update metadata for cache management
      this.updateCacheMetadata(fingerprint, cacheKey, expiryTime);

      console.log('💾 [AICache] Recommendations cached:', {
        fingerprint: fingerprint.substring(0, 8) + '...',
        expiryHours,
        goalsCount: goals.length,
        clientId: clientData._id || clientData.id
      });

      // Clean up old cache entries
      this.cleanupExpiredEntries();
      
      return true;
    } catch (error) {
      console.error('❌ [AICache] Failed to save recommendations:', error);
      return false;
    }
  }

  /**
   * Retrieve AI recommendations from localStorage
   * @param {Array} goals - Goals array
   * @param {Object} clientData - Client data
   * @returns {Object|null} - Cached recommendations or null if not found/expired
   */
  getRecommendations(goals, clientData) {
    try {
      console.log('🔍 [AICache] Starting cache lookup:', {
        goalsCount: goals?.length || 0,
        clientId: clientData?._id || clientData?.id || 'unknown',
        hasGoals: !!goals,
        hasClientData: !!clientData
      });

      const fingerprint = this.createGoalsFingerprint(goals, clientData);
      if (!fingerprint) {
        console.warn('🚫 [AICache] Cannot create fingerprint, skipping cache lookup');
        return null;
      }

      console.log('🆔 [AICache] Generated fingerprint:', fingerprint.substring(0, 12) + '...');

      const cacheKey = this.cacheKeyPrefix + fingerprint;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log('📭 [AICache] No cached entry found for key:', cacheKey);
        
        // Debug: Show what keys are actually in localStorage
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith(this.cacheKeyPrefix));
        console.log('🔍 [AICache] Available cache keys:', allKeys.map(k => k.substring(this.cacheKeyPrefix.length, this.cacheKeyPrefix.length + 12) + '...'));
        
        return null;
      }

      console.log('📦 [AICache] Found cached entry, validating...');

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired
      if (cacheEntry.expiryTime && now > cacheEntry.expiryTime) {
        const hoursExpired = Math.round((now - cacheEntry.expiryTime) / (60 * 60 * 1000));
        console.log('⏰ [AICache] Cache expired:', hoursExpired + 'h ago, removing');
        this.removeCachedRecommendations(fingerprint);
        return null;
      }

      // Validate cache entry structure
      if (!cacheEntry.recommendations || !cacheEntry.timestamp) {
        console.warn('🔧 [AICache] Invalid cache entry structure:', {
          hasRecommendations: !!cacheEntry.recommendations,
          hasTimestamp: !!cacheEntry.timestamp,
          entryKeys: Object.keys(cacheEntry)
        });
        this.removeCachedRecommendations(fingerprint);
        return null;
      }

      const ageMinutes = Math.round((now - cacheEntry.timestamp) / (60 * 1000));
      const hoursUntilExpiry = Math.round((cacheEntry.expiryTime - now) / (60 * 60 * 1000));
      
      console.log('✅ [AICache] Valid cache found:', {
        fingerprint: fingerprint.substring(0, 12) + '...',
        ageMinutes: ageMinutes + 'm',
        hoursUntilExpiry: hoursUntilExpiry + 'h',
        goalsCount: cacheEntry.goalsCount,
        clientId: cacheEntry.clientId,
        cacheSize: JSON.stringify(cacheEntry).length + ' chars'
      });

      return {
        recommendations: cacheEntry.recommendations,
        timestamp: cacheEntry.timestamp,
        ageMinutes,
        fromCache: true
      };
    } catch (error) {
      console.error('❌ [AICache] Failed to retrieve recommendations:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      return null;
    }
  }

  /**
   * Remove cached recommendations for specific fingerprint
   * @param {string} fingerprint - Goals fingerprint
   */
  removeCachedRecommendations(fingerprint) {
    try {
      const cacheKey = this.cacheKeyPrefix + fingerprint;
      localStorage.removeItem(cacheKey);
      this.removeCacheMetadata(fingerprint);
      
      console.log('🗑️ [AICache] Removed cached recommendations:', fingerprint.substring(0, 8) + '...');
    } catch (error) {
      console.error('❌ [AICache] Failed to remove cached recommendations:', error);
    }
  }

  /**
   * Clear all cached recommendations
   */
  clearAllCache() {
    try {
      const metadata = this.getCacheMetadata();
      let removedCount = 0;

      for (const fingerprint in metadata.entries) {
        const cacheKey = this.cacheKeyPrefix + fingerprint;
        localStorage.removeItem(cacheKey);
        removedCount++;
      }

      localStorage.removeItem(this.metadataKey);
      
      console.log('🧹 [AICache] Cleared all cached recommendations:', removedCount + ' entries');
      return removedCount;
    } catch (error) {
      console.error('❌ [AICache] Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    try {
      const metadata = this.getCacheMetadata();
      const now = Date.now();
      let totalEntries = 0;
      let expiredEntries = 0;
      let totalSize = 0;

      for (const fingerprint in metadata.entries) {
        totalEntries++;
        const entry = metadata.entries[fingerprint];
        
        if (entry.expiryTime && now > entry.expiryTime) {
          expiredEntries++;
        }

        // Estimate size (rough calculation)
        const cacheKey = this.cacheKeyPrefix + fingerprint;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          totalSize += cached.length;
        }
      }

      return {
        totalEntries,
        expiredEntries,
        activeEntries: totalEntries - expiredEntries,
        totalSizeKB: Math.round(totalSize / 1024),
        lastCleanup: metadata.lastCleanup
      };
    } catch (error) {
      console.error('❌ [AICache] Failed to get cache stats:', error);
      return { totalEntries: 0, expiredEntries: 0, activeEntries: 0, totalSizeKB: 0 };
    }
  }

  /**
   * Update cache metadata for management
   * @param {string} fingerprint - Goals fingerprint
   * @param {string} cacheKey - Cache key
   * @param {number} expiryTime - Expiry timestamp
   */
  updateCacheMetadata(fingerprint, cacheKey, expiryTime) {
    try {
      const metadata = this.getCacheMetadata();
      
      metadata.entries[fingerprint] = {
        cacheKey,
        timestamp: Date.now(),
        expiryTime
      };

      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ [AICache] Failed to update metadata:', error);
    }
  }

  /**
   * Remove cache metadata entry
   * @param {string} fingerprint - Goals fingerprint
   */
  removeCacheMetadata(fingerprint) {
    try {
      const metadata = this.getCacheMetadata();
      delete metadata.entries[fingerprint];
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ [AICache] Failed to remove metadata:', error);
    }
  }

  /**
   * Get cache metadata
   * @returns {Object} - Cache metadata
   */
  getCacheMetadata() {
    try {
      const metadata = localStorage.getItem(this.metadataKey);
      return metadata ? JSON.parse(metadata) : {
        entries: {},
        created: Date.now(),
        lastCleanup: Date.now()
      };
    } catch (error) {
      console.error('❌ [AICache] Failed to get metadata, creating new:', error);
      return {
        entries: {},
        created: Date.now(),
        lastCleanup: Date.now()
      };
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries() {
    try {
      const metadata = this.getCacheMetadata();
      const now = Date.now();
      let removedCount = 0;

      // Only run cleanup once per hour to avoid performance impact
      if (metadata.lastCleanup && (now - metadata.lastCleanup) < (60 * 60 * 1000)) {
        return;
      }

      for (const fingerprint in metadata.entries) {
        const entry = metadata.entries[fingerprint];
        
        if (entry.expiryTime && now > entry.expiryTime) {
          localStorage.removeItem(entry.cacheKey);
          delete metadata.entries[fingerprint];
          removedCount++;
        }
      }

      // If we have too many entries, remove oldest ones
      const entryCount = Object.keys(metadata.entries).length;
      if (entryCount > this.maxCacheSize) {
        const sortedEntries = Object.entries(metadata.entries)
          .sort(([,a], [,b]) => a.timestamp - b.timestamp);
        
        const entriesToRemove = sortedEntries.slice(0, entryCount - this.maxCacheSize);
        
        for (const [fingerprint, entry] of entriesToRemove) {
          localStorage.removeItem(entry.cacheKey);
          delete metadata.entries[fingerprint];
          removedCount++;
        }
      }

      metadata.lastCleanup = now;
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));

      if (removedCount > 0) {
        console.log('🧹 [AICache] Cleanup completed:', removedCount + ' entries removed');
      }
    } catch (error) {
      console.error('❌ [AICache] Cleanup failed:', error);
    }
  }

  /**
   * Check if recommendations are cached for given goals and client
   * @param {Array} goals - Goals array
   * @param {Object} clientData - Client data
   * @returns {boolean} - True if cached and not expired
   */
  hasCachedRecommendations(goals, clientData) {
    const cached = this.getRecommendations(goals, clientData);
    return cached !== null;
  }

  /**
   * Force refresh - remove cached data and return false
   * @param {Array} goals - Goals array
   * @param {Object} clientData - Client data
   * @returns {boolean} - Always returns false after clearing cache
   */
  forceRefresh(goals, clientData) {
    const fingerprint = this.createGoalsFingerprint(goals, clientData);
    if (fingerprint) {
      this.removeCachedRecommendations(fingerprint);
      console.log('🔄 [AICache] Force refresh - cache cleared for fingerprint:', fingerprint.substring(0, 8) + '...');
    }
    return false;
  }
}

// Create and export singleton instance
const aiRecommendationsCache = new AIRecommendationsCache();

export default aiRecommendationsCache;

// Also export the class for testing if needed
export { AIRecommendationsCache };