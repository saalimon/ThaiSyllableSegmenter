const ThaiSyllableSegmenter = require('../src/ThaiSyllableSegmenter');
const fs = require('fs').promises;
const path = require('path');

/**
 * Demo script showing how to use the Thai Syllable Segmenter
 */
async function runDemo() {
    console.log('Thai Syllable Segmenter CRF Demo');
    console.log('================================\n');

    try {
        // Initialize the segmenter
        const segmenter = new ThaiSyllableSegmenter({
            learningRate: 0.1,
            maxIterations: 50,
            regularization: 0.01
        });

        console.log('Step 1: Loading training data...');
        
        // Load training data
        const trainingDataPath = path.join(__dirname, 'training_data.json');
        const trainingDataRaw = await fs.readFile(trainingDataPath, 'utf-8');
        const trainingData = JSON.parse(trainingDataRaw);
        
        console.log(`Loaded ${trainingData.length} training samples\n`);

        console.log('Step 2: Training the model...');
        console.log('This may take a few minutes...\n');
        
        // Train the model
        await segmenter.train(trainingData);
        
        console.log('Training completed successfully!\n');

        console.log('Step 3: Testing the segmenter...');
        console.log('================================\n');
        
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
            
            console.log(`Test ${i + 1}:`);
            console.log(`  Input: "${text}"`);
            console.log(`  Output: [${syllables.map(s => `"${s}"`).join(', ')}]`);
            console.log(`  Syllables: ${syllables.join(' | ')}`);
            console.log('');
        }

        console.log('Step 4: Model Information');
        console.log('========================\n');
        
        const modelInfo = segmenter.getModelInfo();
        console.log('Model Configuration:');
        console.log(`  Features: ${modelInfo.numFeatures}`);
        console.log(`  Labels: ${modelInfo.numLabels}`);
        console.log(`  Learning Rate: ${modelInfo.config.learningRate}`);
        console.log(`  Max Iterations: ${modelInfo.config.maxIterations}`);
        console.log(`  Regularization: ${modelInfo.config.regularization}`);
        console.log('');

        console.log('Step 5: Saving the model...');
        
        // Save the trained model
        const modelPath = path.join(__dirname, '..', 'models', 'demo_model.json');
        await segmenter.saveModel(modelPath);
        
        console.log(`Model saved to: ${modelPath}\n`);

        console.log('Step 6: Loading and testing saved model...');
        
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
