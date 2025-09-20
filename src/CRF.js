const { Matrix } = require('ml-matrix');
const _ = require('lodash');

/**
 * Conditional Random Fields implementation for sequence labeling
 */
class CRF {
    constructor(options = {}) {
        this.learningRate = options.learningRate || 0.1;
        this.maxIterations = options.maxIterations || 100;
        this.regularization = options.regularization || 0.01;
        this.tolerance = options.tolerance || 1e-6;
        
        this.weights = null;
        this.featureMap = new Map();
        this.labelMap = new Map();
        this.numFeatures = 0;
        this.numLabels = 0;
    }

    /**
     * Train the CRF model
     * @param {Array} sequences - Training sequences
     * @param {Array} labels - Corresponding label sequences
     */
    train(sequences, labels) {
        console.log('Initializing CRF training...');
        
        // Build feature and label mappings
        this._buildMappings(sequences, labels);
        
        // Initialize weights
        this.weights = new Float64Array(this.numFeatures * this.numLabels);
        
        console.log(`Features: ${this.numFeatures}, Labels: ${this.numLabels}`);
        
        let prevLogLikelihood = -Infinity;
        
        for (let iter = 0; iter < this.maxIterations; iter++) {
            let logLikelihood = 0;
            const gradients = new Float64Array(this.weights.length);
            
            // Process each sequence
            for (let i = 0; i < sequences.length; i++) {
                const sequence = sequences[i];
                const labelSeq = labels[i];
                
                // Forward-backward algorithm
                const { alpha, beta, Z } = this._forwardBackward(sequence);
                
                // Update log likelihood
                logLikelihood += this._computeSequenceLogLikelihood(sequence, labelSeq, Z);
                
                // Compute gradients
                this._updateGradients(sequence, labelSeq, alpha, beta, Z, gradients);
            }
            
            // Add regularization
            for (let j = 0; j < this.weights.length; j++) {
                logLikelihood -= this.regularization * this.weights[j] * this.weights[j] / 2;
                gradients[j] -= this.regularization * this.weights[j];
            }
            
            // Update weights
            for (let j = 0; j < this.weights.length; j++) {
                this.weights[j] += this.learningRate * gradients[j];
            }
            
            console.log(`Iteration ${iter + 1}: Log-likelihood = ${logLikelihood.toFixed(6)}`);
            
            // Check convergence
            if (Math.abs(logLikelihood - prevLogLikelihood) < this.tolerance) {
                console.log('Converged!');
                break;
            }
            
            prevLogLikelihood = logLikelihood;
        }
        
        console.log('Training completed.');
    }

    /**
     * Predict label sequence using Viterbi algorithm
     * @param {Array} sequence - Input sequence of feature vectors
     * @returns {Array} Predicted label sequence
     */
    predict(sequence) {
        if (!this.weights) {
            throw new Error('Model not trained yet');
        }

        const n = sequence.length;
        if (n === 0) return [];

        // Viterbi algorithm
        const dp = Array(n).fill(null).map(() => new Float64Array(this.numLabels));
        const path = Array(n).fill(null).map(() => new Int32Array(this.numLabels));

        // Initialize first position
        for (let j = 0; j < this.numLabels; j++) {
            dp[0][j] = this._computeScore(sequence[0], j);
        }

        // Forward pass
        for (let i = 1; i < n; i++) {
            for (let j = 0; j < this.numLabels; j++) {
                let maxScore = -Infinity;
                let bestPrev = 0;

                for (let k = 0; k < this.numLabels; k++) {
                    const score = dp[i - 1][k] + this._computeTransitionScore(k, j) + 
                                 this._computeScore(sequence[i], j);
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestPrev = k;
                    }
                }

                dp[i][j] = maxScore;
                path[i][j] = bestPrev;
            }
        }

        // Find best final state
        let bestFinal = 0;
        let bestScore = dp[n - 1][0];
        for (let j = 1; j < this.numLabels; j++) {
            if (dp[n - 1][j] > bestScore) {
                bestScore = dp[n - 1][j];
                bestFinal = j;
            }
        }

        // Backtrack to find best path
        const result = new Array(n);
        result[n - 1] = bestFinal;
        
        for (let i = n - 2; i >= 0; i--) {
            result[i] = path[i + 1][result[i + 1]];
        }

        // Convert back to label strings
        const labelNames = Array.from(this.labelMap.entries())
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0]);

        return result.map(idx => labelNames[idx]);
    }

    /**
     * Build feature and label mappings
     */
    _buildMappings(sequences, labels) {
        this.featureMap.clear();
        this.labelMap.clear();
        
        let featureIdx = 0;
        let labelIdx = 0;

        // Build label mapping
        for (const labelSeq of labels) {
            for (const label of labelSeq) {
                if (!this.labelMap.has(label)) {
                    this.labelMap.set(label, labelIdx++);
                }
            }
        }

        // Build feature mapping
        for (const sequence of sequences) {
            for (const features of sequence) {
                for (const feature of features) {
                    if (!this.featureMap.has(feature)) {
                        this.featureMap.set(feature, featureIdx++);
                    }
                }
            }
        }

        this.numFeatures = featureIdx;
        this.numLabels = labelIdx;
    }

    /**
     * Forward-backward algorithm for computing marginal probabilities
     */
    _forwardBackward(sequence) {
        const n = sequence.length;
        const alpha = Array(n).fill(null).map(() => new Float64Array(this.numLabels));
        const beta = Array(n).fill(null).map(() => new Float64Array(this.numLabels));

        // Forward pass
        for (let j = 0; j < this.numLabels; j++) {
            alpha[0][j] = Math.exp(this._computeScore(sequence[0], j));
        }

        for (let i = 1; i < n; i++) {
            for (let j = 0; j < this.numLabels; j++) {
                let sum = 0;
                for (let k = 0; k < this.numLabels; k++) {
                    sum += alpha[i - 1][k] * 
                           Math.exp(this._computeTransitionScore(k, j) + 
                                   this._computeScore(sequence[i], j));
                }
                alpha[i][j] = sum;
            }
        }

        // Backward pass
        for (let j = 0; j < this.numLabels; j++) {
            beta[n - 1][j] = 1.0;
        }

        for (let i = n - 2; i >= 0; i--) {
            for (let j = 0; j < this.numLabels; j++) {
                let sum = 0;
                for (let k = 0; k < this.numLabels; k++) {
                    sum += beta[i + 1][k] * 
                           Math.exp(this._computeTransitionScore(j, k) + 
                                   this._computeScore(sequence[i + 1], k));
                }
                beta[i][j] = sum;
            }
        }

        // Compute partition function
        const Z = alpha[n - 1].reduce((sum, val) => sum + val, 0);

        return { alpha, beta, Z };
    }

    /**
     * Compute score for a feature vector and label
     */
    _computeScore(features, label) {
        let score = 0;
        for (const feature of features) {
            const featureIdx = this.featureMap.get(feature);
            if (featureIdx !== undefined) {
                const weightIdx = featureIdx * this.numLabels + label;
                score += this.weights[weightIdx];
            }
        }
        return score;
    }

    /**
     * Compute transition score between two labels
     */
    _computeTransitionScore(fromLabel, toLabel) {
        // Simple transition feature
        const transitionFeature = `TRANS_${fromLabel}_${toLabel}`;
        const featureIdx = this.featureMap.get(transitionFeature);
        
        if (featureIdx !== undefined) {
            const weightIdx = featureIdx * this.numLabels + toLabel;
            return this.weights[weightIdx];
        }
        
        return 0;
    }

    /**
     * Compute log likelihood for a sequence
     */
    _computeSequenceLogLikelihood(sequence, labels, Z) {
        let score = 0;
        
        for (let i = 0; i < sequence.length; i++) {
            const labelIdx = this.labelMap.get(labels[i]);
            score += this._computeScore(sequence[i], labelIdx);
            
            if (i > 0) {
                const prevLabelIdx = this.labelMap.get(labels[i - 1]);
                score += this._computeTransitionScore(prevLabelIdx, labelIdx);
            }
        }
        
        return score - Math.log(Z);
    }

    /**
     * Update gradients using marginal probabilities
     */
    _updateGradients(sequence, labels, alpha, beta, Z, gradients) {
        const n = sequence.length;

        for (let i = 0; i < n; i++) {
            const labelIdx = this.labelMap.get(labels[i]);

            // Feature expectations under the model
            for (let j = 0; j < this.numLabels; j++) {
                const marginal = (alpha[i][j] * beta[i][j]) / Z;
                
                for (const feature of sequence[i]) {
                    const featureIdx = this.featureMap.get(feature);
                    if (featureIdx !== undefined) {
                        const weightIdx = featureIdx * this.numLabels + j;
                        gradients[weightIdx] -= marginal;
                    }
                }
            }

            // Add empirical feature counts
            for (const feature of sequence[i]) {
                const featureIdx = this.featureMap.get(feature);
                if (featureIdx !== undefined) {
                    const weightIdx = featureIdx * this.numLabels + labelIdx;
                    gradients[weightIdx] += 1;
                }
            }
        }
    }

    /**
     * Save model to JSON
     */
    saveModel() {
        return {
            weights: Array.from(this.weights),
            featureMap: Array.from(this.featureMap.entries()),
            labelMap: Array.from(this.labelMap.entries()),
            numFeatures: this.numFeatures,
            numLabels: this.numLabels,
            config: {
                learningRate: this.learningRate,
                maxIterations: this.maxIterations,
                regularization: this.regularization,
                tolerance: this.tolerance
            }
        };
    }

    /**
     * Load model from JSON
     */
    loadModel(modelData) {
        this.weights = new Float64Array(modelData.weights);
        this.featureMap = new Map(modelData.featureMap);
        this.labelMap = new Map(modelData.labelMap);
        this.numFeatures = modelData.numFeatures;
        this.numLabels = modelData.numLabels;
        
        if (modelData.config) {
            this.learningRate = modelData.config.learningRate;
            this.maxIterations = modelData.config.maxIterations;
            this.regularization = modelData.config.regularization;
            this.tolerance = modelData.config.tolerance;
        }
    }
}

module.exports = CRF;
