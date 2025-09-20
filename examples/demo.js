const ThaiSyllableSegmenter = require('../src/ThaiSyllableSegmenter');
const fs = require('fs').promises;
const path = require('path');

/**
 * Training and Demo script for Thai Syllable Segmenter using real datasets
 * Uses datasets/training.json for training and datasets/testing.json for evaluation
 * Saves the trained model to models/demo_model.json
 */
async function runDemo() {
    console.log('Thai Syllable Segmenter CRF - Training & Demo');
    console.log('==============================================\n');

    try {
        // Initialize the segmenter with very conservative parameters for stability
        const segmenter = new ThaiSyllableSegmenter({
            learningRate: 0.001,   // Much lower learning rate
            maxIterations: 10,     // Fewer iterations
            regularization: 0.5    // Much higher regularization
        });

        console.log('Step 1: Loading training data...');
        
        // Load training data from converted datasets
        const trainingDataPath = path.join(__dirname, '..', 'examples', 'training_data.json');
        const trainingDataRaw = await fs.readFile(trainingDataPath, 'utf-8');
        const allTrainingData = JSON.parse(trainingDataRaw);
        
        // Use a smaller subset to ensure stable training
        const trainingData = allTrainingData.slice(0, 20); // Use only first 20 samples
        
        console.log(`Loaded ${allTrainingData.length} total samples, using ${trainingData.length} for training\n`);

        console.log('Step 2: Training the model...');
        console.log('Using subset for stable training...\n');
        
        // Train the model
        await segmenter.train(trainingData);
        
        console.log('Training completed successfully!\n');

        console.log('Step 3: Loading test data and evaluating...');
        console.log('============================================\n');
        
        // Load test data
        const testDataPath = path.join(__dirname, '..', 'examples', 'testing.json');
        const testDataRaw = await fs.readFile(testDataPath, 'utf-8');
        const testData = JSON.parse(testDataRaw);

        console.log(`Loaded ${testData.length} test samples from examples/testing.json\n`);
        console.log('Evaluating model on training set...');
        const trainEval = segmenter.evaluate(trainingData);
        console.log(`Training Accuracy: ${(trainEval.accuracy * 100).toFixed(2)}%`);
        console.log(`Precision: ${(trainEval.precision * 100).toFixed(2)}%`);
        console.log(`Recall: ${(trainEval.recall * 100).toFixed(2)}%`);
        console.log(`F1 Score: ${(trainEval.f1Score * 100).toFixed(2)}%\n`);
        // Evaluate on test data
        console.log('Evaluating model on test set...');
        const evaluation = segmenter.evaluate(testData);
        console.log(`Test Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);
        console.log(`Precision: ${(evaluation.precision * 100).toFixed(2)}%`);
        console.log(`Recall: ${(evaluation.recall * 100).toFixed(2)}%`);
        console.log(`F1 Score: ${(evaluation.f1Score * 100).toFixed(2)}%\n`);

        console.log('Step 4: Testing on sample texts...');
        console.log('===================================\n');
        
        // Test some sample texts from test data first
        console.log('Testing on actual test samples:');
        for (let i = 0; i < Math.min(5, testData.length); i++) {
            const sample = testData[i];
            const predicted = segmenter.segment(sample.text);
            const expected = sample.syllables;
            
            console.log(`Test Sample ${i + 1}:`);
            console.log(`  Input: "${sample.text}"`);
            console.log(`  Expected: [${expected.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Predicted: [${predicted.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Match: ${JSON.stringify(predicted) === JSON.stringify(expected) ? '✓' : '✗'}`);
            console.log('');
        }

        console.log('Step 5: Testing the segmenter on additional examples...');
        console.log('=======================================================\n');
        
        // Test cases
        const testTexts = [
            "สวัสดีครับผม",
            "ขอบคุณมากๆครับ", 
            "ไทยแลนด์สวยมาก",
            "การศึกษาภาษาไทย",
            "มหาวิทยาลัยเกษตรศาสตร์",
            "คอมพิวเตอร์และเทคโนโลยี",
            "อาหารไทยอร่อยมาก",
            "วัฒนธรรมประเพณี",
            "เครื่องประดับทองคำ",
            "โทรศัพท์มือถือ"
        ];

        for (let i = 0; i < testTexts.length; i++) {
            const text = testTexts[i];
            const syllables = segmenter.segment(text);
            
            console.log(`Additional Test ${i + 1}:`);
            console.log(`  Input: "${text}"`);
            console.log(`  Output: [${syllables.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Syllables: ${syllables.join(' | ')}`);
            console.log('');
        }

        console.log('Step 6: Model Information');
        console.log('=========================\n');
        
        const modelInfo = segmenter.getModelInfo();
        console.log('Model Configuration:');
        console.log(`  Features: ${modelInfo.numFeatures}`);
        console.log(`  Labels: ${modelInfo.numLabels}`);
        console.log(`  Learning Rate: ${modelInfo.config.learningRate}`);
        console.log(`  Max Iterations: ${modelInfo.config.maxIterations}`);
        console.log(`  Regularization: ${modelInfo.config.regularization}`);
        console.log(`  Training Samples: ${trainingData.length}`);
        console.log(`  Test Samples: ${testData.length}`);
        console.log('');

        console.log('Step 7: Saving the model...');

        // Save the trained model to models/demo_model.json
        const modelPath = path.join(__dirname, '..', 'models', 'demo_model.json');
        await segmenter.saveModel(modelPath);
        
        console.log(`Model saved to: ${modelPath}\n`);

        console.log('Step 8: Loading and testing saved model...');
        
        // Create new segmenter instance and load the saved model
        const newSegmenter = new ThaiSyllableSegmenter();
        await newSegmenter.loadModel(modelPath);
        
        // Test the loaded model
        const testText = "การทดสอบโมเดล";
        const result = newSegmenter.segment(testText);
        
        console.log(`Loaded model test:`);
        console.log(`  Input: "${testText}"`);
        console.log(`  Output: [${result.map(s => `"${s}"`).join(', ')}]`);
        console.log('');

        console.log('Demo completed successfully!');
        console.log('===============================');
        console.log('Model trained on real Thai syllable data and saved successfully!');
        console.log(`Training accuracy and test evaluation completed.`);
        console.log(`Model file: models/demo_model.json`);
        console.log('You can now use the trained model for Thai syllable segmentation.');

    } catch (error) {
        console.error('Demo failed:', error.message);
        console.error(error.stack);
    }
}

// Interactive mode
async function interactiveMode() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\nInteractive Mode');
    console.log('===============');
    console.log('Enter Thai text to segment (or "quit" to exit):');

    // Load a pre-trained model if it exists
    let segmenter = null;
    try {
        const modelPath = path.join(__dirname, '..', 'models', 'demo_model.json');
        segmenter = new ThaiSyllableSegmenter();
        await segmenter.loadModel(modelPath);
        console.log('Loaded existing model for interactive use.\n');
    } catch (error) {
        console.log('No pre-trained model found. Please run the demo first.\n');
        rl.close();
        return;
    }

    const askQuestion = () => {
        rl.question('> ', (input) => {
            if (input.toLowerCase() === 'quit') {
                rl.close();
                console.log('Goodbye!');
                return;
            }

            if (input.trim()) {
                try {
                    const syllables = segmenter.segment(input.trim());
                    console.log(`Syllables: [${syllables.map(s => `"${s}"`).join(', ')}]`);
                    console.log(`Joined: ${syllables.join(' | ')}\n`);
                } catch (error) {
                    console.log(`Error: ${error.message}\n`);
                }
            }
            
            askQuestion();
        });
    };

    askQuestion();
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--interactive') || args.includes('-i')) {
        await interactiveMode();
    } else {
        await runDemo();
        
        // Ask if user wants interactive mode
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nWould you like to enter interactive mode? (y/n): ', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                interactiveMode();
            }
        });
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runDemo, interactiveMode };
