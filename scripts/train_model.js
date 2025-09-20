#!/usr/bin/env node

/**
 * Simple training script for Thai Syllable Segmenter
 * Uses conservative parameters to ensure stable training
 */

const ThaiSyllableSegmenter = require('../src/ThaiSyllableSegmenter');
const fs = require('fs').promises;
const path = require('path');

async function trainModel() {
    console.log('Thai Syllable Segmenter - Model Training');
    console.log('========================================\n');

    try {
        // Initialize with very conservative parameters
        console.log('Initializing segmenter with conservative parameters...');
        const segmenter = new ThaiSyllableSegmenter({
            learningRate: 0.001,   // Very low learning rate
            maxIterations: 400,     // Very few iterations
            regularization: 0.5     // High regularization
        });

        // Load training data
        console.log('Loading training data...');
        // const trainingPath = path.join(__dirname, '..', 'datasets', 'training.json');
        const trainingPath = path.join(__dirname, '..', 'examples', 'training_data.json');
        const trainingData = JSON.parse(await fs.readFile(trainingPath, 'utf-8'));
        console.log(`Loaded ${trainingData.length} training samples`);

        // Take only a small subset for initial testing
        const subset = trainingData.slice(0, 1000);
        console.log(`Using ${subset.length} samples for initial training\n`);

        // Display sample data
        console.log('Sample training data:');
        for (let i = 0; i < Math.min(3, subset.length); i++) {
            const sample = subset[i];
            console.log(`  ${i+1}. "${sample.text}" -> [${sample.syllables.map(s => `"${s}"`).join(', ')}]`);
        }
        console.log('');

        // Train the model
        console.log('Training model...');
        await segmenter.train(subset);
        console.log('Training completed!\n');

        // Test on some basic examples
        console.log('Testing segmentation:');
        const testTexts = [
            "สวัสดี",
            "ขอบคุณ", 
            "อยากกิน",
            "มาสด้ากินน้ำมัน",
            "มาลีสวยมาก"
        ];

        for (const text of testTexts) {
            try {
                const syllables = segmenter.segment(text);
                console.log(`  "${text}" -> [${syllables.map(s => `"${s}"`).join(', ')}]`);
            } catch (error) {
                console.log(`  "${text}" -> Error: ${error.message}`);
            }
        }
        console.log('');

        // Save model
        const modelPath = path.join(__dirname, '..', 'models', 'thai_model_simple.json');
        await segmenter.saveModel(modelPath);
        console.log(`Model saved to: ${modelPath}`);

        // Get model info
        const info = segmenter.getModelInfo();
        console.log('\nModel Information:');
        console.log(`  Features: ${info.numFeatures}`);
        console.log(`  Labels: ${info.numLabels}`);
        console.log(`  Training samples: ${subset.length}`);

        console.log('\nTraining completed successfully!');

    } catch (error) {
        console.error('Training failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    trainModel();
}

module.exports = trainModel;
