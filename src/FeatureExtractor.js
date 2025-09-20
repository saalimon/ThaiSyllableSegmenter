const ThaiUtils = require('./ThaiUtils');

/**
 * Feature extractor for Thai syllable segmentation
 */
class FeatureExtractor {
    constructor() {
        this.thaiUtils = new ThaiUtils();
        this.windowSize = 3; // Context window size
    }

    /**
     * Extract features for a character at a specific position
     * @param {Array} chars - Array of characters
     * @param {number} pos - Position of the character
     * @returns {Array} Array of feature strings
     */
    extractFeatures(chars, pos) {
        const features = [];
        const char = chars[pos];
        
        // Basic character features
        features.push(`CHAR=${char}`);
        features.push(`CLASS=${this.thaiUtils.getCharClass(char)}`);
        
        // Consonant-specific features
        if (this.thaiUtils.getCharClass(char) === 'CONSONANT') {
            features.push(`CONS_CLASS=${this.thaiUtils.getConsonantClass(char)}`);
            features.push(`CAN_END_SYLLABLE=${this.thaiUtils.canEndSyllable(char)}`);
            features.push(`CAN_START_CLUSTER=${this.thaiUtils.canStartCluster(char)}`);
        }
        
        // Vowel-specific features
        if (this.thaiUtils.getCharClass(char) === 'VOWEL') {
            features.push(`VOWEL_POS=${this.thaiUtils.getVowelPosition(char)}`);
            features.push(`IS_LEADING_VOWEL=${this.thaiUtils.isLeadingVowel(char)}`);
        }

        // Position features
        features.push(`IS_FIRST=${pos === 0}`);
        features.push(`IS_LAST=${pos === chars.length - 1}`);
        features.push(`POSITION=${pos}`);
        features.push(`RELATIVE_POS=${pos / chars.length}`);

        // Context features (surrounding characters)
        this._addContextFeatures(features, chars, pos);
        
        // N-gram features
        this._addNgramFeatures(features, chars, pos);
        
        // Syllable structure features
        this._addStructureFeatures(features, chars, pos);
        
        // Phonological features
        this._addPhonologicalFeatures(features, chars, pos);
        
        // Statistical features
        this._addStatisticalFeatures(features, chars, pos);

        return features;
    }

    /**
     * Add context features from surrounding characters
     */
    _addContextFeatures(features, chars, pos) {
        const windowSize = this.windowSize;
        
        // Previous characters
        for (let i = 1; i <= windowSize; i++) {
            const prevPos = pos - i;
            if (prevPos >= 0) {
                const prevChar = chars[prevPos];
                features.push(`PREV_${i}_CHAR=${prevChar}`);
                features.push(`PREV_${i}_CLASS=${this.thaiUtils.getCharClass(prevChar)}`);
            } else {
                features.push(`PREV_${i}_CHAR=<START>`);
                features.push(`PREV_${i}_CLASS=<START>`);
            }
        }
        
        // Next characters
        for (let i = 1; i <= windowSize; i++) {
            const nextPos = pos + i;
            if (nextPos < chars.length) {
                const nextChar = chars[nextPos];
                features.push(`NEXT_${i}_CHAR=${nextChar}`);
                features.push(`NEXT_${i}_CLASS=${this.thaiUtils.getCharClass(nextChar)}`);
            } else {
                features.push(`NEXT_${i}_CHAR=<END>`);
                features.push(`NEXT_${i}_CLASS=<END>`);
            }
        }
    }

    /**
     * Add n-gram features
     */
    _addNgramFeatures(features, chars, pos) {
        // Bigrams
        if (pos > 0) {
            const bigram = chars[pos - 1] + chars[pos];
            features.push(`BIGRAM=${bigram}`);
            
            const bigramClass = this.thaiUtils.getCharClass(chars[pos - 1]) + 
                               '_' + this.thaiUtils.getCharClass(chars[pos]);
            features.push(`BIGRAM_CLASS=${bigramClass}`);
        }
        
        if (pos < chars.length - 1) {
            const bigram = chars[pos] + chars[pos + 1];
            features.push(`NEXT_BIGRAM=${bigram}`);
            
            const bigramClass = this.thaiUtils.getCharClass(chars[pos]) + 
                               '_' + this.thaiUtils.getCharClass(chars[pos + 1]);
            features.push(`NEXT_BIGRAM_CLASS=${bigramClass}`);
        }
        
        // Trigrams
        if (pos > 1) {
            const trigram = chars[pos - 2] + chars[pos - 1] + chars[pos];
            features.push(`TRIGRAM=${trigram}`);
        }
        
        if (pos < chars.length - 2) {
            const trigram = chars[pos] + chars[pos + 1] + chars[pos + 2];
            features.push(`NEXT_TRIGRAM=${trigram}`);
        }
    }

    /**
     * Add syllable structure features
     */
    _addStructureFeatures(features, chars, pos) {
        // Check for consonant clusters
        if (pos > 0 && pos < chars.length - 1) {
            const prev = chars[pos - 1];
            const curr = chars[pos];
            const next = chars[pos + 1];
            
            if (this.thaiUtils.isValidCluster(prev, curr)) {
                features.push('IN_CONSONANT_CLUSTER=true');
            }
            
            if (this.thaiUtils.isValidCluster(curr, next)) {
                features.push('STARTS_CONSONANT_CLUSTER=true');
            }
        }
        
        // Pattern around current position
        const windowStart = Math.max(0, pos - 2);
        const windowEnd = Math.min(chars.length, pos + 3);
        const window = chars.slice(windowStart, windowEnd);
        const pattern = this.thaiUtils.getSyllablePattern(window);
        features.push(`PATTERN=${pattern}`);
        
        // Distance to vowels
        const distanceToNextVowel = this._findNextVowel(chars, pos);
        const distanceToPrevVowel = this._findPrevVowel(chars, pos);
        
        if (distanceToNextVowel !== -1) {
            features.push(`NEXT_VOWEL_DIST=${distanceToNextVowel}`);
        }
        
        if (distanceToPrevVowel !== -1) {
            features.push(`PREV_VOWEL_DIST=${distanceToPrevVowel}`);
        }
    }

    /**
     * Add phonological features
     */
    _addPhonologicalFeatures(features, chars, pos) {
        const char = chars[pos];
        
        // Leading vowel handling
        if (this.thaiUtils.isLeadingVowel(char)) {
            features.push('IS_LEADING_VOWEL=true');
            
            // Find the consonant this vowel modifies
            for (let i = pos + 1; i < chars.length && i < pos + 4; i++) {
                if (this.thaiUtils.getCharClass(chars[i]) === 'CONSONANT') {
                    features.push(`LEADING_VOWEL_CONS_DIST=${i - pos}`);
                    break;
                }
            }
        }
        
        // Tone mark handling
        if (pos > 0) {
            const prevChar = chars[pos - 1];
            if (this.thaiUtils.getCharClass(char) === 'TONE' && 
                this.thaiUtils.getCharClass(prevChar) === 'VOWEL') {
                features.push('TONE_AFTER_VOWEL=true');
            }
        }
        
        // Consonant ending patterns
        if (this.thaiUtils.getCharClass(char) === 'CONSONANT' && 
            this.thaiUtils.canEndSyllable(char)) {
            
            // Check if this consonant is likely ending a syllable
            let isLikelyEnding = false;
            
            if (pos === chars.length - 1) {
                isLikelyEnding = true;
            } else if (pos < chars.length - 1) {
                const nextChar = chars[pos + 1];
                const nextClass = this.thaiUtils.getCharClass(nextChar);
                
                if (nextClass === 'CONSONANT' || 
                    this.thaiUtils.isLeadingVowel(nextChar)) {
                    isLikelyEnding = true;
                }
            }
            
            features.push(`LIKELY_SYLLABLE_END=${isLikelyEnding}`);
        }
    }

    /**
     * Add statistical features based on character frequency and context
     */
    _addStatisticalFeatures(features, chars, pos) {
        const char = chars[pos];
        
        // Character frequency class (high, medium, low)
        const freqClass = this._getCharacterFrequencyClass(char);
        features.push(`CHAR_FREQ_CLASS=${freqClass}`);
        
        // Syllable position likelihood
        const syllablePos = this._estimateSyllablePosition(chars, pos);
        features.push(`ESTIMATED_SYLLABLE_POS=${syllablePos}`);
        
        // Boundary likelihood based on context
        const boundaryScore = this._calculateBoundaryLikelihood(chars, pos);
        features.push(`BOUNDARY_LIKELIHOOD=${boundaryScore > 0.5 ? 'HIGH' : 'LOW'}`);
    }

    /**
     * Find distance to next vowel
     */
    _findNextVowel(chars, pos) {
        for (let i = pos + 1; i < chars.length && i < pos + 5; i++) {
            if (this.thaiUtils.getCharClass(chars[i]) === 'VOWEL') {
                return i - pos;
            }
        }
        return -1;
    }

    /**
     * Find distance to previous vowel
     */
    _findPrevVowel(chars, pos) {
        for (let i = pos - 1; i >= 0 && i > pos - 5; i--) {
            if (this.thaiUtils.getCharClass(chars[i]) === 'VOWEL') {
                return pos - i;
            }
        }
        return -1;
    }

    /**
     * Get character frequency class (simplified)
     */
    _getCharacterFrequencyClass(char) {
        // Common Thai characters
        const highFreq = new Set(['ก', 'น', 'ร', 'า', 'ะ', 'เ', 'อ', 'ม', 'ท', 'ล']);
        const mediumFreq = new Set(['ด', 'ต', 'ส', 'ห', 'ย', 'ว', 'ข', 'ป', 'บ', 'ค']);
        
        if (highFreq.has(char)) return 'HIGH';
        if (mediumFreq.has(char)) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Estimate syllable position (beginning, middle, end)
     */
    _estimateSyllablePosition(chars, pos) {
        const char = chars[pos];
        const charClass = this.thaiUtils.getCharClass(char);
        
        if (this.thaiUtils.isLeadingVowel(char)) {
            return 'BEGINNING';
        }
        
        if (charClass === 'CONSONANT' && this.thaiUtils.canEndSyllable(char)) {
            // Look ahead to see if this might be syllable end
            if (pos === chars.length - 1 || 
                (pos < chars.length - 1 && 
                 this.thaiUtils.getCharClass(chars[pos + 1]) === 'CONSONANT')) {
                return 'END';
            }
        }
        
        return 'MIDDLE';
    }

    /**
     * Calculate boundary likelihood score
     */
    _calculateBoundaryLikelihood(chars, pos) {
        if (pos === 0 || pos === chars.length - 1) {
            return 1.0; // Always boundary at text edges
        }
        
        let score = 0;
        const curr = chars[pos];
        const prev = chars[pos - 1];
        const currClass = this.thaiUtils.getCharClass(curr);
        const prevClass = this.thaiUtils.getCharClass(prev);
        
        // Consonant to consonant transitions often indicate boundaries
        if (prevClass === 'CONSONANT' && currClass === 'CONSONANT') {
            score += 0.7;
        }
        
        // Leading vowel indicates new syllable
        if (this.thaiUtils.isLeadingVowel(curr)) {
            score += 0.8;
        }
        
        // Sonorant consonant at end often indicates syllable boundary
        if (prevClass === 'CONSONANT' && this.thaiUtils.canEndSyllable(prev) &&
            currClass === 'CONSONANT') {
            score += 0.6;
        }
        
        return Math.min(1.0, score);
    }

    /**
     * Extract features for entire sequence
     */
    extractSequenceFeatures(text) {
        const chars = this.thaiUtils.splitToCharacters(this.thaiUtils.normalize(text));
        const features = [];
        
        for (let i = 0; i < chars.length; i++) {
            features.push(this.extractFeatures(chars, i));
        }
        
        return { features, chars };
    }
}

module.exports = FeatureExtractor;
