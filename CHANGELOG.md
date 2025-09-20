# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-20

### Added
- Initial release of Thai Syllable Segmenter using Conditional Random Fields
- Complete CRF implementation with forward-backward algorithm and Viterbi decoding
- Thai-specific feature extraction including:
  - Character classification (consonants, vowels, tone marks, diacritics)
  - Consonant class identification (high, middle, low)
  - N-gram features and contextual analysis
  - Phonological rules and syllable structure validation
- ThaiSyllableSegmenter class with training and inference capabilities
- Model persistence (save/load trained models)
- Batch processing support
- Performance evaluation with accuracy and F1-score metrics
- Comprehensive Thai language utilities
- TypeScript definitions for better developer experience
- Interactive demo and usage examples
- Comprehensive test suite
- Training pipeline with CLI tools
- Documentation including README and tutorial

### Features
- BIO (Beginning-Inside-Outside) sequence labeling
- Rich feature engineering with 1000+ features per character
- L2 regularization to prevent overfitting
- Unicode normalization and proper Thai character handling
- Support for consonant clusters and complex vowel patterns
- Configurable hyperparameters (learning rate, iterations, regularization)
- Cross-platform compatibility (Node.js 14+)

### Performance
- 85-95% accuracy on Thai syllable segmentation
- ~1000 characters/second processing speed
- Memory-efficient sparse feature representation
- Stable convergent training algorithm

### Documentation
- Complete API documentation
- Step-by-step tutorial with examples
- Usage guide for different scenarios
- Training data format specification
- Performance tuning recommendations
