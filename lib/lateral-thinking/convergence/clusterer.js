/**
 * Idea Clustering System
 * 
 * Groups similar ideas together and selects representatives to reduce
 * redundancy and present diverse options. Uses similarity-based clustering
 * to identify conceptually related ideas.
 * 
 * @module lateral-thinking/convergence/clusterer
 */

import { log as logger } from '../../utils/logger.js';

/**
 * Clusterer Class
 * 
 * Reduces idea redundancy through similarity-based clustering
 */
export class Clusterer {
  /**
   * Create clusterer
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      similarityThreshold: 0.7,  // Ideas > 70% similar are clustered
      maxClusters: 10,           // Maximum number of clusters to create
      minClusterSize: 1,         // Minimum ideas per cluster
      ...config
    };
  }

  /**
   * Cluster ideas and select representatives
   * 
   * @param {Array} ideas - Ideas to cluster
   * @param {Object} options - Clustering options
   * @returns {Promise<Array>} Representative ideas from each cluster
   */
  async cluster(ideas, options = {}) {
    const config = { ...this.config, ...options };
    
    logger.info('Clusterer: Starting clustering', {
      ideaCount: ideas.length,
      threshold: config.similarityThreshold
    });

    if (ideas.length === 0) {
      return [];
    }

    if (ideas.length === 1) {
      return ideas;
    }

    // Calculate similarity matrix
    const similarities = this._calculateSimilarityMatrix(ideas);
    
    // Perform hierarchical clustering
    const clusters = this._hierarchicalCluster(ideas, similarities, config);
    
    // Select best representative from each cluster
    const representatives = clusters.map(cluster => 
      this._selectRepresentative(cluster)
    );

    logger.info('Clusterer: Clustering complete', {
      originalCount: ideas.length,
      clusterCount: clusters.length,
      representativeCount: representatives.length
    });

    return representatives;
  }

  /**
   * Calculate similarity matrix for all idea pairs
   * 
   * @param {Array} ideas - Ideas to compare
   * @returns {Array<Array<number>>} Similarity matrix
   * @private
   */
  _calculateSimilarityMatrix(ideas) {
    const n = ideas.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;  // Idea is 100% similar to itself
        } else {
          const similarity = this._calculateSimilarity(ideas[i], ideas[j]);
          matrix[i][j] = similarity;
          matrix[j][i] = similarity;  // Symmetric
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate similarity between two ideas
   * 
   * Uses Jaccard similarity on word sets, with weighting for titles
   * 
   * @param {Object} idea1 - First idea
   * @param {Object} idea2 - Second idea
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _calculateSimilarity(idea1, idea2) {
    // Extract text from both ideas
    const text1 = `${idea1.title} ${idea1.description}`.toLowerCase();
    const text2 = `${idea2.title} ${idea2.description}`.toLowerCase();

    // Tokenize into word sets
    const words1 = new Set(this._tokenize(text1));
    const words2 = new Set(this._tokenize(text2));

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccard = intersection.size / union.size;

    // Boost similarity if titles are very similar
    const titleSim = this._titleSimilarity(idea1.title, idea2.title);
    
    // Weighted combination: 70% content, 30% title
    const similarity = (jaccard * 0.7) + (titleSim * 0.3);

    return similarity;
  }

  /**
   * Calculate title similarity
   * 
   * @param {string} title1 - First title
   * @param {string} title2 - Second title
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _titleSimilarity(title1, title2) {
    const words1 = new Set(this._tokenize(title1.toLowerCase()));
    const words2 = new Set(this._tokenize(title2.toLowerCase()));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Tokenize text into words
   * 
   * @param {string} text - Text to tokenize
   * @returns {Array<string>} Array of tokens
   * @private
   */
  _tokenize(text) {
    // Remove punctuation and split on whitespace
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)  // Ignore short words
      .filter(word => !this._isStopWord(word));  // Remove stop words
  }

  /**
   * Check if word is a stop word
   * 
   * @param {string} word - Word to check
   * @returns {boolean} True if stop word
   * @private
   */
  _isStopWord(word) {
    const stopWords = new Set([
      'this', 'that', 'these', 'those', 'with', 'from', 'have', 'been',
      'will', 'would', 'could', 'should', 'about', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'between', 'under'
    ]);
    return stopWords.has(word);
  }

  /**
   * Perform hierarchical clustering
   * 
   * @param {Array} ideas - Ideas to cluster
   * @param {Array<Array<number>>} similarities - Similarity matrix
   * @param {Object} config - Clustering configuration
   * @returns {Array<Array>} Clusters of ideas
   * @private
   */
  _hierarchicalCluster(ideas, similarities, config) {
    // Start with each idea in its own cluster
    const clusters = ideas.map((idea, idx) => ({
      ideas: [idea],
      indices: [idx]
    }));

    // Merge clusters until threshold or max clusters reached
    while (clusters.length > config.maxClusters) {
      // Find most similar pair of clusters
      let maxSim = -1;
      let mergeI = -1;
      let mergeJ = -1;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const sim = this._clusterSimilarity(
            clusters[i].indices,
            clusters[j].indices,
            similarities
          );

          if (sim > maxSim) {
            maxSim = sim;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Stop if no pair exceeds threshold
      if (maxSim < config.similarityThreshold) {
        break;
      }

      // Merge the two most similar clusters
      clusters[mergeI].ideas.push(...clusters[mergeJ].ideas);
      clusters[mergeI].indices.push(...clusters[mergeJ].indices);
      clusters.splice(mergeJ, 1);
    }

    // Return just the idea arrays
    return clusters.map(c => c.ideas);
  }

  /**
   * Calculate similarity between two clusters
   * 
   * Uses average linkage: average similarity between all pairs
   * 
   * @param {Array<number>} indices1 - Indices of first cluster
   * @param {Array<number>} indices2 - Indices of second cluster
   * @param {Array<Array<number>>} similarities - Similarity matrix
   * @returns {number} Cluster similarity
   * @private
   */
  _clusterSimilarity(indices1, indices2, similarities) {
    let sum = 0;
    let count = 0;

    for (const i of indices1) {
      for (const j of indices2) {
        sum += similarities[i][j];
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Select best representative from a cluster
   * 
   * Chooses the idea with highest score (if available) or
   * the one most central to the cluster
   * 
   * @param {Array} cluster - Cluster of ideas
   * @returns {Object} Representative idea
   * @private
   */
  _selectRepresentative(cluster) {
    if (cluster.length === 1) {
      return cluster[0];
    }

    // If ideas have scores, select highest scoring
    if (cluster[0].score && cluster[0].score.total !== undefined) {
      return cluster.reduce((best, idea) => 
        idea.score.total > best.score.total ? idea : best
      );
    }

    // If ideas have feasibility, prefer most feasible
    if (cluster[0].feasibility !== undefined) {
      return cluster.reduce((best, idea) => 
        idea.feasibility > best.feasibility ? idea : best
      );
    }

    // Otherwise, select the first one (arbitrary but deterministic)
    return cluster[0];
  }

  /**
   * Get clustering statistics
   * 
   * @param {Array} originalIdeas - Original ideas before clustering
   * @param {Array} clustered - Clustered representative ideas
   * @returns {Object} Statistics
   */
  getStatistics(originalIdeas, clustered) {
    return {
      originalCount: originalIdeas.length,
      clusteredCount: clustered.length,
      reductionPercent: Math.round((1 - clustered.length / originalIdeas.length) * 100),
      avgClusterSize: originalIdeas.length / clustered.length
    };
  }
}

export default Clusterer;

