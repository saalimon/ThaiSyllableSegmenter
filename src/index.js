const ThaiSyllableSegmenter = require('./ThaiSyllableSegmenter');
const CRF = require('./CRF');
const FeatureExtractor = require('./FeatureExtractor');
const ThaiUtils = require('./ThaiUtils');

module.exports = {
    ThaiSyllableSegmenter,
    CRF,
    FeatureExtractor,
    ThaiUtils
};

// If this file is run directly, show a simple demo
if (require.main === module) {
    async function demo() {
        console.log('Thai Syllable Segmenter Demo');
        console.log('============================');
        
        const segmenter = new ThaiSyllableSegmenter({
            learningRate: 0.1,
            maxIterations: 50,
            regularization: 0.01
        });
        
        // Sample training data
        const trainingData = [
            { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
            { text: "ครับ", syllables: ["ครับ"] },
            { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] },
            { text: "สบายดี", syllables: ["สบาย", "ดี"] },
            { text: "ไทยแลนด์", syllables: ["ไทย", "แลนด์"] },
            { text: "กรุงเทพ", syllables: ["กรุง", "เทพ"] },
            { text: "มหาวิทยาลัย", syllables: ["มหา", "วิท", "ยา", "ลัย"] },
            { text: "คอมพิวเตอร์", syllables: ["คอม", "พิว", "เต", "อร์"] },
            { text: "ประเทศ", syllables: ["ประ", "เทศ"] },
            { text: "ภาษา", syllables: ["ภา", "ษา"] }
        ];
        
        console.log('Training the model...');
        try {
            await segmenter.train(trainingData);
            console.log('Training completed!\\n');
            
            // Test the segmenter
            const testTexts = [
                "สวัสดีครับ",
                "ขอบคุณมาก",
                "ไทยแลนด์สวยมาก",
                "การศึกษา"
            ];
            
            console.log('Testing the segmenter:');
            console.log('=====================');
            
            for (const text of testTexts) {
                const syllables = segmenter.segment(text);
                console.log(`Text: "${text}"`);
                console.log(`Syllables: [${syllables.map(s => `"${s}"`).join(', ')}]`);
                console.log(`Joined: "${syllables.join('-')}"`);
                console.log('');
            }
            
            // Show model info
            console.log('Model Information:');
            console.log('=================');
            const modelInfo = segmenter.getModelInfo();
            console.log(JSON.stringify(modelInfo, null, 2));
            
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
    
    demo();
}
