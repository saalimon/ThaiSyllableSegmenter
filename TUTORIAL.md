# Thai Syllable Segmentation using Conditional Random Fields - Tutorial

## Overview

This tutorial explains how to use the Thai Syllable Segmenter, which uses Conditional Random Fields (CRF) to segment Thai text into syllables. The segmenter learns from training data to identify syllable boundaries in Thai text.

## What is Syllable Segmentation?

Syllable segmentation is the process of breaking down Thai words into their constituent syllables. This is important for:
- Text-to-speech systems
- Phonetic analysis  
- Language learning applications
- Thai language processing

For example:
- "สวัสดี" → ["สวัส", "ดี"]
- "มหาวิทยาลัย" → ["มหา", "วิท", "ยา", "ลัย"]

## How Conditional Random Fields Work

CRFs are a type of probabilistic model used for sequence labeling. In our case:

1. **Input**: A sequence of Thai characters
2. **Features**: Character properties, context, phonological rules
3. **Labels**: B (beginning of syllable) or I (inside syllable)
4. **Output**: Probability distribution over label sequences

### Feature Extraction

The system extracts rich features for each character:

- **Character identity**: The actual character
- **Character class**: Consonant, vowel, tone mark, etc.
- **Context**: Surrounding characters
- **N-grams**: Character combinations
- **Phonological**: Thai-specific linguistic rules
- **Positional**: Location in text

### Training Process

1. Convert syllable boundaries to BIO labels
2. Extract features for each character position
3. Use CRF algorithm to learn feature weights
4. Optimize using gradient descent

## Installation and Setup

```bash
git clone <repository>
cd thai-syllable-segmenter-crf
npm install
```

## Quick Start

### 1. Basic Usage

```javascript
const { ThaiSyllableSegmenter } = require('./src/index');

async function quickStart() {
    // Create segmenter
    const segmenter = new ThaiSyllableSegmenter();

    // Training data (text with correct syllable boundaries)
    const trainingData = [
        { text: "สวัสดี", syllables: ["สวัส", "ดี"] },
        { text: "ขอบคุณ", syllables: ["ขอบ", "คุณ"] },
        { text: "สบายดี", syllables: ["สบาย", "ดี"] }
    ];

    // Train the model
    await segmenter.train(trainingData);

    // Segment new text
    const result = segmenter.segment("สวัสดีครับ");
    console.log(result); // ["สวัส", "ดีค", "รับ"]
}
```

### 2. Training Data Format

Training data should be an array of objects with:
- `text`: Original Thai text
- `syllables`: Array of syllables that reconstruct the original text

```javascript
const trainingData = [
    {
        text: "มหาวิทยาลัย",
        syllables: ["มหา", "วิท", "ยา", "ลัย"]
    },
    {
        text: "คอมพิวเตอร์", 
        syllables: ["คอม", "พิว", "เต", "อร์"]
    }
];
```

**Important**: The syllables must join to exactly reconstruct the original text.

### 3. Model Configuration

```javascript
const segmenter = new ThaiSyllableSegmenter({
    learningRate: 0.1,      // How fast to learn (0.01-0.3)
    maxIterations: 100,     // Maximum training iterations
    regularization: 0.01,   // Prevent overfitting (0.001-0.1)
    tolerance: 1e-6        // Convergence threshold
});
```

### 4. Saving and Loading Models

```javascript
// Save trained model
await segmenter.saveModel('./my_model.json');

// Load saved model
const newSegmenter = new ThaiSyllableSegmenter();
await newSegmenter.loadModel('./my_model.json');
```

## Advanced Features

### Batch Processing

```javascript
const texts = ["สวัสดี", "ขอบคุณ", "สบายดี"];
const results = segmenter.segmentBatch(texts);
```

### Model Evaluation

```javascript
const testData = [
    { text: "สวัสดี", syllables: ["สวัส", "ดี"] }
];

const metrics = segmenter.evaluate(testData);
console.log(`Accuracy: ${metrics.accuracy * 100}%`);
console.log(`F1 Score: ${metrics.f1Score * 100}%`);
```

### Model Information

```javascript
const info = segmenter.getModelInfo();
console.log(`Features: ${info.numFeatures}`);
console.log(`Labels: ${info.numLabels}`);
```

## Training Your Own Models

### 1. Prepare Training Data

Create a JSON file with your training data:

```json
[
    { "text": "สวัสดี", "syllables": ["สวัส", "ดี"] },
    { "text": "ครับ", "syllables": ["ครับ"] },
    { "text": "ขอบคุณ", "syllables": ["ขอบ", "คุณ"] }
]
```

### 2. Use Training Script

```bash
node src/train.js training_data.json model.json --learningRate 0.1 --maxIterations 50
```

### 3. Training Tips

- **Data Quality**: Ensure syllable boundaries are consistent
- **Data Size**: More data generally means better performance
- **Hyperparameters**: 
  - Start with default values
  - Increase `maxIterations` for better convergence
  - Adjust `learningRate` if training is unstable
  - Use `regularization` to prevent overfitting

## Understanding Thai Syllable Structure

Thai syllables generally follow these patterns:
- **C**: Consonant only (ก)
- **CV**: Consonant + Vowel (กา)
- **CVC**: Consonant + Vowel + Consonant (กับ)
- **CCV**: Consonant cluster + Vowel (กรา)

Special considerations:
- Leading vowels (เ, แ, โ, ใ, ไ) appear before consonants
- Tone marks and diacritics attach to syllables
- Some consonants can end syllables (ง, น, ม, etc.)

## Feature Engineering

The system automatically extracts:

1. **Basic Features**
   - Character identity and class
   - Position in text
   
2. **Context Features**
   - Previous/next characters (window of 3)
   - N-gram combinations
   
3. **Linguistic Features**
   - Thai character classification
   - Consonant classes (high/mid/low)
   - Vowel positions
   - Phonological constraints

4. **Statistical Features**
   - Character frequency
   - Boundary likelihood

## Performance Tuning

### Improving Accuracy

1. **More Training Data**: The most effective approach
2. **Better Data Quality**: Consistent syllable boundaries
3. **Feature Engineering**: Add domain-specific features
4. **Hyperparameter Tuning**: Optimize learning parameters

### Common Issues

1. **Overfitting**: Reduce learning rate, increase regularization
2. **Underfitting**: More iterations, more complex features
3. **Inconsistent Boundaries**: Review and clean training data
4. **Memory Issues**: Reduce feature complexity or batch size

## Examples and Use Cases

### Example 1: Educational App

```javascript
// For language learning
const learningTexts = [
    "วันนี้อากาศดี",
    "ฉันชื่อสมชาย", 
    "คุณอยู่ที่ไหน"
];

const syllables = segmenter.segmentBatch(learningTexts);
// Display with syllable boundaries for pronunciation practice
```

### Example 2: Text-to-Speech Preprocessing

```javascript
// Prepare text for TTS
function prepareForTTS(text) {
    const syllables = segmenter.segment(text);
    return syllables.map(syllable => ({
        text: syllable,
        pronunciation: convertToPronunciation(syllable)
    }));
}
```

### Example 3: Linguistic Analysis

```javascript
// Analyze syllable patterns
function analyzeSyllablePatterns(texts) {
    const patterns = new Map();
    
    texts.forEach(text => {
        const syllables = segmenter.segment(text);
        syllables.forEach(syllable => {
            const pattern = getPhonologicalPattern(syllable);
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        });
    });
    
    return patterns;
}
```

## Troubleshooting

### Common Errors

1. **"Model not loaded"**: Train a model first or load existing model
2. **"Length mismatch"**: Check that syllables reconstruct original text exactly
3. **"Training failed"**: Check data format and reduce complexity
4. **Poor performance**: Need more/better training data

### Debugging Tips

1. Start with small, clean datasets
2. Verify data format carefully
3. Check model convergence during training
4. Use evaluation metrics to measure performance
5. Test on held-out validation data

## Contributing

To contribute to this project:
1. Add more training data
2. Improve feature extraction
3. Optimize CRF implementation
4. Add evaluation metrics
5. Create better documentation

## References

- Thai Language Structure and Phonology
- Conditional Random Fields for Sequence Labeling
- Feature Engineering for NLP
- Thai Text Processing Techniques

---

This tutorial provides a comprehensive guide to using the Thai Syllable Segmenter. For more examples, see the `examples/` directory.
