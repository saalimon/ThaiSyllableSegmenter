const { ThaiSyllableSegmenter } = require('../src/index');

/**
 * Simple usage examples for Thai Syllable Segmenter
 */
async function basicUsage() {
    console.log('Basic Usage Example');
    console.log('==================\n');

    // Create segmenter instance
    const segmenter = new ThaiSyllableSegmenter();

    // Simple training data
    const trainingData = [
        { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
        { text: "ครับ", syllables: ["ครับ"] },
        { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] },
        { text: "สบายดี", syllables: ["สบาย", "ดี"] }
    ];

    // Train the model
    console.log('Training model...');
    await segmenter.train(trainingData);

    // Test segmentation
    const texts = [
        "สวัสดีครับ",
        "ขอบคุณมาก",
        "สบายดีไหม"
    ];

    console.log('Results:');
    texts.forEach(text => {
        const syllables = segmenter.segment(text);
        console.log(`"${text}" → [${syllables.join(', ')}]`);
    });
}

async function advancedUsage() {
    console.log('\n\nAdvanced Usage Example');
    console.log('=====================\n');

    // Create segmenter with custom options
    const segmenter = new ThaiSyllableSegmenter({
        learningRate: 0.15,
        maxIterations: 30,
        regularization: 0.005
    });

    // More comprehensive training data
    const trainingData = [
        { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
        { text: "ครับ", syllables: ["ครับ"] },
        { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] },
        { text: "สบายดี", syllables: ["สบาย", "ดี"] },
        { text: "ไทยแลนด์", syllables: ["ไทย", "แลนด์"] },
        { text: "มหาวิทยาลัย", syllables: ["มหา", "วิท", "ยา", "ลัย"] },
        { text: "คอมพิวเตอร์", syllables: ["คอม", "พิว", "เต", "อร์"] },
        { text: "การศึกษา", syllables: ["การ", "ศึก", "ษา"] }
    ];

    console.log('Training with advanced configuration...');
    await segmenter.train(trainingData);

    // Batch processing
    const batchTexts = [
        "การศึกษาไทย",
        "เทคโนโลยี", 
        "วิทยาศาสตร์"
    ];

    console.log('Batch processing results:');
    const batchResults = segmenter.segmentBatch(batchTexts);
    batchResults.forEach((syllables, index) => {
        console.log(`"${batchTexts[index]}" → [${syllables.join(', ')}]`);
    });

    // Save and load model
    console.log('\nSaving model...');
    await segmenter.saveModel('./example_model.json');

    console.log('Loading model...');
    const newSegmenter = new ThaiSyllableSegmenter();
    await newSegmenter.loadModel('./example_model.json');

    // Test loaded model
    const testResult = newSegmenter.segment("ทดสอบโมเดล");
    console.log(`Loaded model test: "ทดสอบโมเดล" → [${testResult.join(', ')}]`);

    // Model evaluation (if you have test data)
    const testData = [
        { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
        { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] }
    ];

    console.log('\nModel evaluation:');
    const evaluation = segmenter.evaluate(testData);
    console.log(`Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);
    console.log(`F1 Score: ${(evaluation.f1Score * 100).toFixed(2)}%`);
}

// Run examples
async function main() {
    try {
        await basicUsage();
        await advancedUsage();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { basicUsage, advancedUsage };
