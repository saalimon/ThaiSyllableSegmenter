const ThaiSyllableSegmenter = require('./ThaiSyllableSegmenter');
const fs = require('fs').promises;
const path = require('path');

/**
 * Training script for Thai Syllable Segmenter
 */
class TrainingManager {
    constructor() {
        this.segmenter = null;
    }

    /**
     * Load training data from JSON file
     * @param {string} dataPath - Path to training data file
     * @returns {Array} Training data
     */
    async loadTrainingData(dataPath) {
        try {
            const data = await fs.readFile(dataPath, 'utf-8');
            const trainingData = JSON.parse(data);
            
            console.log(`Loaded ${trainingData.length} training samples from ${dataPath}`);
            return trainingData;
            
        } catch (error) {
            throw new Error(`Failed to load training data: ${error.message}`);
        }
    }

    /**
     * Validate training data format
     * @param {Array} data - Training data to validate
     */
    validateTrainingData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Training data must be an array');
        }

        for (let i = 0; i < data.length; i++) {
            const sample = data[i];
            
            if (!sample.text || typeof sample.text !== 'string') {
                throw new Error(`Sample ${i}: 'text' field is required and must be a string`);
            }
            
            if (!sample.syllables || !Array.isArray(sample.syllables)) {
                throw new Error(`Sample ${i}: 'syllables' field is required and must be an array`);
            }
            
            // Check if syllables reconstruct the original text
            const reconstructed = sample.syllables.join('');
            if (reconstructed !== sample.text) {
                console.warn(`Sample ${i}: Syllables don't match original text`);
                console.warn(`Original: "${sample.text}"`);
                console.warn(`Reconstructed: "${reconstructed}"`);
            }
        }
        
        console.log('Training data validation completed');
    }

    /**
     * Split data into training and validation sets
     * @param {Array} data - Full dataset
     * @param {number} trainRatio - Ratio for training set (default: 0.8)
     * @returns {Object} {trainData, validationData}
     */
    splitData(data, trainRatio = 0.8) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const splitIndex = Math.floor(shuffled.length * trainRatio);
        
        return {
            trainData: shuffled.slice(0, splitIndex),
            validationData: shuffled.slice(splitIndex)
        };
    }

    /**
     * Train the model
     * @param {Array} trainingData - Training data
     * @param {Object} options - Training options
     */
    async trainModel(trainingData, options = {}) {
        const defaultOptions = {
            learningRate: 0.1,
            maxIterations: 100,
            regularization: 0.01,
            tolerance: 1e-6
        };
        
        const config = { ...defaultOptions, ...options };
        
        console.log('Training configuration:');
        console.log(JSON.stringify(config, null, 2));
        
        this.segmenter = new ThaiSyllableSegmenter(config);
        
        const startTime = Date.now();
        await this.segmenter.train(trainingData, config);
        const endTime = Date.now();
        
        console.log(`Training completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    }

    /**
     * Evaluate model performance
     * @param {Array} testData - Test data
     * @returns {Object} Evaluation results
     */
    evaluateModel(testData) {
        if (!this.segmenter) {
            throw new Error('Model not trained yet');
        }

        console.log('Evaluating model...');
        const results = this.segmenter.evaluate(testData);
        
        console.log('Evaluation Results:');
        console.log('==================');
        console.log(`Accuracy: ${(results.accuracy * 100).toFixed(2)}%`);
        console.log(`Precision: ${(results.precision * 100).toFixed(2)}%`);
        console.log(`Recall: ${(results.recall * 100).toFixed(2)}%`);
        console.log(`F1 Score: ${(results.f1Score * 100).toFixed(2)}%`);
        console.log(`Exact Matches: ${results.exactMatches}/${results.totalSamples}`);
        
        return results;
    }

    /**
     * Show sample predictions
     * @param {Array} testData - Sample data to predict
     * @param {number} numSamples - Number of samples to show
     */
    showSamplePredictions(testData, numSamples = 5) {
        if (!this.segmenter) {
            throw new Error('Model not trained yet');
        }

        console.log('Sample Predictions:');
        console.log('==================');
        
        const samples = testData.slice(0, numSamples);
        
        for (let i = 0; i < samples.length; i++) {
            const sample = samples[i];
            const predicted = this.segmenter.segment(sample.text);
            
            console.log(`Sample ${i + 1}:`);
            console.log(`  Text: "${sample.text}"`);
            console.log(`  Expected: [${sample.syllables.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Predicted: [${predicted.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Match: ${JSON.stringify(predicted) === JSON.stringify(sample.syllables) ? '✓' : '✗'}`);
            console.log('');
        }
    }

    /**
     * Save trained model
     * @param {string} modelPath - Path to save the model
     */
    async saveModel(modelPath) {
        if (!this.segmenter) {
            throw new Error('Model not trained yet');
        }

        await this.segmenter.saveModel(modelPath);
    }

    /**
     * Complete training pipeline
     * @param {string} dataPath - Path to training data
     * @param {string} modelPath - Path to save the model
     * @param {Object} options - Training options
     */
    async trainPipeline(dataPath, modelPath, options = {}) {
        try {
            // Load and validate data
            const data = await this.loadTrainingData(dataPath);
            this.validateTrainingData(data);
            
            // Split data
            const { trainData, validationData } = this.splitData(data, 0.8);
            console.log(`Training samples: ${trainData.length}`);
            console.log(`Validation samples: ${validationData.length}`);
            
            // Train model
            await this.trainModel(trainData, options);
            
            // Evaluate on validation set
            if (validationData.length > 0) {
                this.evaluateModel(validationData);
                this.showSamplePredictions(validationData);
            }
            
            // Save model
            await this.saveModel(modelPath);
            
            console.log('Training pipeline completed successfully!');
            
        } catch (error) {
            console.error('Training pipeline failed:', error.message);
            throw error;
        }
    }
}

// Export for use as module
module.exports = TrainingManager;

// Command line interface
if (require.main === module) {
    async function main() {
        const args = process.argv.slice(2);
        
        if (args.length < 2) {
            console.log('Usage: node train.js <data_file> <model_output> [options]');
            console.log('');
            console.log('Example:');
            console.log('  node train.js ./data/training_data.json ./models/thai_model.json');
            process.exit(1);
        }
        
        const dataPath = args[0];
        const modelPath = args[1];
        
        // Parse additional options
        const options = {};
        for (let i = 2; i < args.length; i += 2) {
            if (i + 1 < args.length) {
                const key = args[i].replace(/^--/, '');
                const value = parseFloat(args[i + 1]) || args[i + 1];
                options[key] = value;
            }
        }
        
        const trainer = new TrainingManager();
        await trainer.trainPipeline(dataPath, modelPath, options);
    }
    
    main().catch(console.error);
}
