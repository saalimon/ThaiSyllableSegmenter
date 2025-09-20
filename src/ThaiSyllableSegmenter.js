const CRF = require('./CRF');
const FeatureExtractor = require('./FeatureExtractor');
const ThaiUtils = require('./ThaiUtils');
const fs = require('fs').promises;
const path = require('path');

/**
 * Thai Syllable Segmenter using Conditional Random Fields
 */
class ThaiSyllableSegmenter {
    constructor(options = {}) {
        this.crf = new CRF(options);
        this.featureExtractor = new FeatureExtractor();
        this.thaiUtils = new ThaiUtils();
        this.isModelLoaded = false;
    }

    /**
     * Train the segmenter with training data
     * @param {Array} trainingData - Array of {text, syllables} objects
     * @param {Object} options - Training options
     */
    async train(trainingData, options = {}) {
        console.log('Preparing training data...');
        
        const sequences = [];
        const labels = [];
        
        for (const sample of trainingData) {
            const { features, chars, labelSeq } = this._prepareTrainingSample(
                sample.text, 
                sample.syllables
            );
            
            if (features && labelSeq) {
                sequences.push(features);
                labels.push(labelSeq);
            }
        }
        
        console.log(`Training on ${sequences.length} sequences...`);
        
        if (sequences.length === 0) {
            throw new Error('No valid training samples found');
        }
        
        // Train the CRF model
        this.crf.train(sequences, labels);
        this.isModelLoaded = true;
        
        console.log('Training completed successfully!');
    }

    /**
     * Segment Thai text into syllables
     * @param {string} text - Thai text to segment
     * @returns {Array} Array of syllables
     */
    segment(text) {
        if (!this.isModelLoaded) {
            throw new Error('Model not loaded. Please train or load a model first.');
        }

        if (!text || text.trim().length === 0) {
            return [];
        }

        // Normalize and extract features
        const normalized = this.thaiUtils.normalize(text);
        const { features, chars } = this.featureExtractor.extractSequenceFeatures(normalized);
        
        if (chars.length === 0) {
            return [];
        }

        // Predict labels using CRF
        const labels = this.crf.predict(features);
        
        // Convert labels to syllables
        return this._labelsToSyllables(chars, labels);
    }

    /**
     * Segment multiple texts
     * @param {Array} texts - Array of Thai texts
     * @returns {Array} Array of syllable arrays
     */
    segmentBatch(texts) {
        return texts.map(text => this.segment(text));
    }

    /**
     * Save trained model to file
     * @param {string} filePath - Path to save the model
     */
    async saveModel(filePath) {
        if (!this.isModelLoaded) {
            throw new Error('No model to save. Train a model first.');
        }

        const modelData = {
            crf: this.crf.saveModel(),
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0.0',
                description: 'Thai Syllable Segmenter CRF Model'
            }
        };

        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(filePath, JSON.stringify(modelData, null, 2), 'utf-8');
        console.log(`Model saved to ${filePath}`);
    }

    /**
     * Load trained model from file
     * @param {string} filePath - Path to the model file
     */
    async loadModel(filePath) {
        try {
            const modelJson = await fs.readFile(filePath, 'utf-8');
            const modelData = JSON.parse(modelJson);
            
            this.crf.loadModel(modelData.crf);
            this.isModelLoaded = true;
            
            console.log(`Model loaded from ${filePath}`);
            
            if (modelData.metadata) {
                console.log(`Model created: ${modelData.metadata.createdAt}`);
                console.log(`Model version: ${modelData.metadata.version}`);
            }
            
        } catch (error) {
            throw new Error(`Failed to load model: ${error.message}`);
        }
    }

    /**
     * Evaluate model performance on test data
     * @param {Array} testData - Array of {text, syllables} objects
     * @returns {Object} Performance metrics
     */
    evaluate(testData) {
        if (!this.isModelLoaded) {
            throw new Error('Model not loaded');
        }

        let totalCharacters = 0;
        let correctBoundaries = 0;
        let predictedBoundaries = 0;
        let trueBoundaries = 0;
        let exactMatches = 0;

        for (const sample of testData) {
            const predicted = this.segment(sample.text);
            const actual = sample.syllables;
            
            // Exact match check
            if (this._arraysEqual(predicted, actual)) {
                exactMatches++;
            }

            // Boundary-level evaluation
            const { correct, predictedCount, trueCount, total } = 
                this._evaluateBoundaries(predicted, actual);
            
            correctBoundaries += correct;
            predictedBoundaries += predictedCount;
            trueBoundaries += trueCount;
            totalCharacters += total;
        }

        const precision = predictedBoundaries > 0 ? correctBoundaries / predictedBoundaries : 0;
        const recall = trueBoundaries > 0 ? correctBoundaries / trueBoundaries : 0;
        const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
        const accuracy = exactMatches / testData.length;

        return {
            accuracy: accuracy,
            precision: precision,
            recall: recall,
            f1Score: f1Score,
            exactMatches: exactMatches,
            totalSamples: testData.length
        };
    }

    /**
     * Prepare a training sample
     */
    _prepareTrainingSample(text, syllables) {
        try {
            const normalized = this.thaiUtils.normalize(text);
            const { features, chars } = this.featureExtractor.extractSequenceFeatures(normalized);
            
            // Create labels from syllable boundaries
            const labelSeq = this._syllablesToLabels(chars, syllables);
            
            if (labelSeq.length !== chars.length) {
                console.warn(`Length mismatch for text: "${text}"`);
                return { features: null, chars: null, labelSeq: null };
            }
            
            return { features, chars, labelSeq };
            
        } catch (error) {
            console.warn(`Error preparing sample "${text}": ${error.message}`);
            return { features: null, chars: null, labelSeq: null };
        }
    }

    /**
     * Convert syllables to BIO labels
     */
    _syllablesToLabels(chars, syllables) {
        const labels = new Array(chars.length);
        let charIndex = 0;

        for (let i = 0; i < syllables.length; i++) {
            const syllable = syllables[i];
            const syllableChars = this.thaiUtils.splitToCharacters(syllable);
            
            for (let j = 0; j < syllableChars.length; j++) {
                if (charIndex >= chars.length) {
                    throw new Error(`Character index out of bounds: ${charIndex} >= ${chars.length}`);
                }
                
                if (chars[charIndex] !== syllableChars[j]) {
                    throw new Error(`Character mismatch at ${charIndex}: expected "${syllableChars[j]}", got "${chars[charIndex]}"`);
                }
                
                if (j === 0) {
                    labels[charIndex] = 'B'; // Beginning of syllable
                } else {
                    labels[charIndex] = 'I'; // Inside syllable
                }
                
                charIndex++;
            }
        }
        
        // Fill any remaining positions with 'I' (shouldn't happen with correct data)
        while (charIndex < chars.length) {
            labels[charIndex] = 'I';
            charIndex++;
        }

        return labels;
    }

    /**
     * Convert BIO labels to syllables
     */
    _labelsToSyllables(chars, labels) {
        const syllables = [];
        let currentSyllable = '';

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const label = labels[i];

            if (label === 'B') {
                // Start new syllable
                if (currentSyllable) {
                    syllables.push(currentSyllable);
                }
                currentSyllable = char;
            } else {
                // Continue current syllable
                currentSyllable += char;
            }
        }

        // Add final syllable
        if (currentSyllable) {
            syllables.push(currentSyllable);
        }

        return syllables;
    }

    /**
     * Check if two arrays are equal
     */
    _arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    }

    /**
     * Evaluate boundary accuracy
     */
    _evaluateBoundaries(predicted, actual) {
        // Convert syllables to boundary positions
        const predictedBoundaries = this._getBoundaryPositions(predicted);
        const actualBoundaries = this._getBoundaryPositions(actual);
        
        const predictedSet = new Set(predictedBoundaries);
        const actualSet = new Set(actualBoundaries);
        
        let correct = 0;
        for (const boundary of predictedSet) {
            if (actualSet.has(boundary)) {
                correct++;
            }
        }

        return {
            correct: correct,
            predictedCount: predictedBoundaries.length,
            trueCount: actualBoundaries.length,
            total: Math.max(
                predicted.reduce((sum, syl) => sum + syl.length, 0),
                actual.reduce((sum, syl) => sum + syl.length, 0)
            )
        };
    }

    /**
     * Get boundary positions from syllables
     */
    _getBoundaryPositions(syllables) {
        const positions = [0]; // Always start with position 0
        let pos = 0;
        
        for (const syllable of syllables) {
            pos += syllable.length;
            positions.push(pos);
        }
        
        return positions.slice(1, -1); // Remove start and end positions
    }

    /**
     * Get model information
     */
    getModelInfo() {
        if (!this.isModelLoaded) {
            return { loaded: false };
        }

        return {
            loaded: true,
            numFeatures: this.crf.numFeatures,
            numLabels: this.crf.numLabels,
            config: {
                learningRate: this.crf.learningRate,
                maxIterations: this.crf.maxIterations,
                regularization: this.crf.regularization
            }
        };
    }
}

module.exports = ThaiSyllableSegmenter;
