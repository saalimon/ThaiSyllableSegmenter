const assert = require('assert');
const ThaiSyllableSegmenter = require('../src/ThaiSyllableSegmenter');
const FeatureExtractor = require('../src/FeatureExtractor');
const ThaiUtils = require('../src/ThaiUtils');
const CRF = require('../src/CRF');

/**
 * Test suite for Thai Syllable Segmenter
 */
class TestSuite {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
    }

    /**
     * Run a test case
     */
    test(description, testFunction) {
        try {
            console.log(`Testing: ${description}`);
            testFunction();
            console.log('✓ PASSED\n');
            this.passed++;
        } catch (error) {
            console.log(`✗ FAILED: ${error.message}\n`);
            this.failed++;
            this.errors.push({ description, error: error.message });
        }
    }

    /**
     * Run async test case
     */
    async testAsync(description, testFunction) {
        try {
            console.log(`Testing: ${description}`);
            await testFunction();
            console.log('✓ PASSED\n');
            this.passed++;
        } catch (error) {
            console.log(`✗ FAILED: ${error.message}\n`);
            this.failed++;
            this.errors.push({ description, error: error.message });
        }
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('Test Results');
        console.log('===========');
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Total: ${this.passed + this.failed}`);
        
        if (this.errors.length > 0) {
            console.log('\nErrors:');
            this.errors.forEach(({ description, error }) => {
                console.log(`- ${description}: ${error}`);
            });
        }
    }
}

async function runTests() {
    console.log('Thai Syllable Segmenter Test Suite');
    console.log('==================================\n');
    
    const tests = new TestSuite();

    // Test Thai Utils
    tests.test('ThaiUtils - Character Classification', () => {
        const utils = new ThaiUtils();
        
        assert.strictEqual(utils.getCharClass('ก'), 'CONSONANT');
        assert.strictEqual(utils.getCharClass('า'), 'VOWEL');
        assert.strictEqual(utils.getCharClass('่'), 'TONE');
        assert.strictEqual(utils.getCharClass('์'), 'DIACRITIC');
        assert.strictEqual(utils.getCharClass('๑'), 'DIGIT');
        assert.strictEqual(utils.getCharClass(' '), 'PUNCT');
        assert.strictEqual(utils.getCharClass('a'), 'NON_THAI');
    });

    tests.test('ThaiUtils - Consonant Classification', () => {
        const utils = new ThaiUtils();
        
        assert.strictEqual(utils.getConsonantClass('ข'), 'HIGH');
        assert.strictEqual(utils.getConsonantClass('ก'), 'MIDDLE');
        assert.strictEqual(utils.getConsonantClass('ค'), 'LOW');
        assert.strictEqual(utils.getConsonantClass('า'), 'NONE');
    });

    tests.test('ThaiUtils - Syllable Ending', () => {
        const utils = new ThaiUtils();
        
        assert.strictEqual(utils.canEndSyllable('ง'), true);
        assert.strictEqual(utils.canEndSyllable('น'), true);
        assert.strictEqual(utils.canEndSyllable('ม'), true);
        assert.strictEqual(utils.canEndSyllable('ก'), true);
        assert.strictEqual(utils.canEndSyllable('จ'), false);
    });

    tests.test('ThaiUtils - Consonant Clusters', () => {
        const utils = new ThaiUtils();
        
        assert.strictEqual(utils.isValidCluster('ก', 'ร'), true);
        assert.strictEqual(utils.isValidCluster('ป', 'ล'), true);
        assert.strictEqual(utils.isValidCluster('ท', 'ร'), true);
        assert.strictEqual(utils.isValidCluster('ง', 'ร'), false);
    });

    tests.test('ThaiUtils - Text Normalization', () => {
        const utils = new ThaiUtils();
        
        const text = "สวัสดี";
        const normalized = utils.normalize(text);
        assert.strictEqual(typeof normalized, 'string');
        assert.strictEqual(normalized.length >= text.length, true);
    });

    tests.test('ThaiUtils - Character Splitting', () => {
        const utils = new ThaiUtils();
        
        const chars = utils.splitToCharacters("สวัสดี");
        assert.strictEqual(Array.isArray(chars), true);
        assert.strictEqual(chars.length, 4); // วั and ดี are single units
        assert.strictEqual(chars[0], 'ส');
        assert.strictEqual(chars[1], 'วั');
        assert.strictEqual(chars[2], 'ส');
        assert.strictEqual(chars[3], 'ดี');
    });

    // Test Feature Extractor
    tests.test('FeatureExtractor - Basic Features', () => {
        const extractor = new FeatureExtractor();
        const chars = ['ส', 'วั', 'ส', 'ดี'];
        
        const features = extractor.extractFeatures(chars, 0);
        assert.strictEqual(Array.isArray(features), true);
        assert.strictEqual(features.length > 0, true);
        
        // Check for basic features
        const hasCharFeature = features.some(f => f.startsWith('CHAR='));
        const hasClassFeature = features.some(f => f.startsWith('CLASS='));
        assert.strictEqual(hasCharFeature, true);
        assert.strictEqual(hasClassFeature, true);
    });

    tests.test('FeatureExtractor - Sequence Features', () => {
        const extractor = new FeatureExtractor();
        
        const result = extractor.extractSequenceFeatures("สวัสดี");
        assert.strictEqual(result.features.length > 0, true);
        assert.strictEqual(result.chars.length > 0, true);
        assert.strictEqual(result.features.length, result.chars.length);
    });

    // Test CRF
    tests.test('CRF - Initialization', () => {
        const crf = new CRF({
            learningRate: 0.1,
            maxIterations: 10,
            regularization: 0.01
        });
        
        assert.strictEqual(crf.learningRate, 0.1);
        assert.strictEqual(crf.maxIterations, 10);
        assert.strictEqual(crf.regularization, 0.01);
        assert.strictEqual(crf.weights, null);
    });

    tests.test('CRF - Model Serialization', () => {
        const crf = new CRF();
        crf.weights = new Float64Array([1, 2, 3, 4]);
        crf.featureMap = new Map([['f1', 0], ['f2', 1]]);
        crf.labelMap = new Map([['B', 0], ['I', 1]]);
        crf.numFeatures = 2;
        crf.numLabels = 2;
        
        const modelData = crf.saveModel();
        assert.strictEqual(Array.isArray(modelData.weights), true);
        assert.strictEqual(Array.isArray(modelData.featureMap), true);
        assert.strictEqual(Array.isArray(modelData.labelMap), true);
        
        const newCrf = new CRF();
        newCrf.loadModel(modelData);
        
        assert.strictEqual(newCrf.numFeatures, 2);
        assert.strictEqual(newCrf.numLabels, 2);
        assert.strictEqual(newCrf.weights.length, 4);
    });

    // Test Thai Syllable Segmenter
    tests.test('ThaiSyllableSegmenter - Initialization', () => {
        const segmenter = new ThaiSyllableSegmenter();
        
        assert.strictEqual(segmenter.isModelLoaded, false);
        assert.notStrictEqual(segmenter.crf, null);
        assert.notStrictEqual(segmenter.featureExtractor, null);
        assert.notStrictEqual(segmenter.thaiUtils, null);
    });

    await tests.testAsync('ThaiSyllableSegmenter - Training and Prediction', async () => {
        const segmenter = new ThaiSyllableSegmenter({
            learningRate: 0.2,
            maxIterations: 5,  // Reduced for testing
            regularization: 0.1
        });
        
        // Sample training data
        const trainingData = [
            { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
            { text: "ครับ", syllables: ["ครับ"] },
            { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] },
            { text: "สบายดี", syllables: ["สบาย", "ดี"] }
        ];
        
        // Train the model
        await segmenter.train(trainingData);
        assert.strictEqual(segmenter.isModelLoaded, true);
        
        // Test prediction
        const result = segmenter.segment("สวัสดี");
        assert.strictEqual(Array.isArray(result), true);
        assert.strictEqual(result.length > 0, true);
        
        // Test that result makes sense (characters should be preserved)
        const joined = result.join('');
        assert.strictEqual(joined, "สวัสดี");
    });

    await tests.testAsync('ThaiSyllableSegmenter - Model Save/Load', async () => {
        const segmenter = new ThaiSyllableSegmenter({
            maxIterations: 3  // Quick training for testing
        });
        
        const trainingData = [
            { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
            { text: "ครับ", syllables: ["ครับ"] }
        ];
        
        await segmenter.train(trainingData);
        
        // Save model to a temporary object (not file for testing)
        const modelData = segmenter.crf.saveModel();
        assert.notStrictEqual(modelData, null);
        
        // Create new segmenter and load model
        const newSegmenter = new ThaiSyllableSegmenter();
        newSegmenter.crf.loadModel(modelData);
        newSegmenter.isModelLoaded = true;
        
        // Test that loaded model works
        const result = newSegmenter.segment("สวัสดี");
        assert.strictEqual(Array.isArray(result), true);
    });

    tests.test('ThaiSyllableSegmenter - Edge Cases', () => {
        const segmenter = new ThaiSyllableSegmenter({
            maxIterations: 1
        });
        
        // Test with empty input
        try {
            segmenter.segment("");
            assert.fail("Should throw error for untrained model");
        } catch (error) {
            assert.strictEqual(error.message.includes("not loaded"), true);
        }
    });

    tests.test('ThaiSyllableSegmenter - Batch Processing', async () => {
        const segmenter = new ThaiSyllableSegmenter({
            maxIterations: 3
        });
        
        const trainingData = [
            { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
            { text: "ครับ", syllables: ["ครับ"] }
        ];
        
        await segmenter.train(trainingData);
        
        const texts = ["สวัสดี", "ครับ"];
        const results = segmenter.segmentBatch(texts);
        
        assert.strictEqual(Array.isArray(results), true);
        assert.strictEqual(results.length, 2);
        assert.strictEqual(Array.isArray(results[0]), true);
        assert.strictEqual(Array.isArray(results[1]), true);
    });

    tests.test('ThaiSyllableSegmenter - Model Info', () => {
        const segmenter = new ThaiSyllableSegmenter();
        
        let info = segmenter.getModelInfo();
        assert.strictEqual(info.loaded, false);
        
        // After creating a simple model structure
        segmenter.crf.numFeatures = 100;
        segmenter.crf.numLabels = 2;
        segmenter.isModelLoaded = true;
        
        info = segmenter.getModelInfo();
        assert.strictEqual(info.loaded, true);
        assert.strictEqual(info.numFeatures, 100);
        assert.strictEqual(info.numLabels, 2);
    });

    // Print results
    tests.printResults();
    
    if (tests.failed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log(`\n❌ ${tests.failed} test(s) failed.`);
        process.exit(1);
    }
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, TestSuite };
