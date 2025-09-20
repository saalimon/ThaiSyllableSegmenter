/**
 * Thai language utilities for character classification and processing
 */
class ThaiUtils {
    constructor() {
        // Thai Unicode ranges and character classifications
        this.consonants = new Set([
            'ก', 'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ',
            'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ',
            'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ฤ', 'ล', 'ฦ', 'ว', 'ศ', 'ษ', 'ส', 'ห', 'ฬ', 'อ', 'ฮ'
        ]);

        this.vowels = new Set([
            'ะ', 'ั', 'า', 'ำ', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'เ', 'แ', 'โ', 'ใ', 'ไ',
            'ฎ', 'ฏ', 'ฤ', 'ฦ', 'ฤๅ', 'ฦๅ'
        ]);

        this.toneMarks = new Set([
            '่', '้', '๊', '๋'
        ]);

        this.diacritics = new Set([
            '์', 'ํ', '๎'
        ]);

        this.digits = new Set([
            '๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'
        ]);

        this.punctuation = new Set([
            '฿', '๚', '๛', 'ฯ', 'ๆ', ' ', '\t', '\n', '\r'
        ]);

        // Consonant classes for phonological features
        this.highClass = new Set(['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห']);
        this.middleClass = new Set(['ก', 'จ', 'ฎ', 'ฏ', 'ด', 'ต', 'บ', 'ป', 'อ']);
        this.lowClass = new Set([
            'ค', 'ฅ', 'ฆ', 'ง', 'ช', 'ซ', 'ฌ', 'ญ', 'ฑ', 'ฒ', 'ณ', 'ท', 'ธ', 'น',
            'พ', 'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ฬ', 'ฮ'
        ]);

        // Sonorant consonants (can end syllables)
        this.sonorants = new Set(['ง', 'น', 'ม', 'ย', 'ร', 'ล', 'ว']);

        // Leading consonants that can form clusters
        this.clusterLeaders = new Set(['ก', 'ข', 'ค', 'ป', 'ผ', 'พ', 'ต', 'ท']);
        this.clusterFollowers = new Set(['ร', 'ล', 'ว']);
    }

    /**
     * Check if character is Thai
     */
    isThai(char) {
        const code = char.charCodeAt(0);
        return (code >= 0x0E00 && code <= 0x0E7F);
    }

    /**
     * Get character class
     */
    getCharClass(char) {
        if (this.consonants.has(char)) return 'CONSONANT';
        if (this.vowels.has(char)) return 'VOWEL';
        if (this.toneMarks.has(char)) return 'TONE';
        if (this.diacritics.has(char)) return 'DIACRITIC';
        if (this.digits.has(char)) return 'DIGIT';
        if (this.punctuation.has(char)) return 'PUNCT';
        if (this.isThai(char)) return 'OTHER_THAI';
        return 'NON_THAI';
    }

    /**
     * Get consonant class (high, middle, low)
     */
    getConsonantClass(char) {
        if (this.highClass.has(char)) return 'HIGH';
        if (this.middleClass.has(char)) return 'MIDDLE';
        if (this.lowClass.has(char)) return 'LOW';
        return 'NONE';
    }

    /**
     * Check if consonant can end a syllable
     */
    canEndSyllable(char) {
        return this.sonorants.has(char) || char === 'ก' || char === 'ด' || 
               char === 'บ' || char === 'ป' || char === 'ต' || char === 'ค';
    }

    /**
     * Check if character can start a consonant cluster
     */
    canStartCluster(char) {
        return this.clusterLeaders.has(char);
    }

    /**
     * Check if character can follow in a consonant cluster
     */
    canFollowInCluster(char) {
        return this.clusterFollowers.has(char);
    }

    /**
     * Check if two consonants can form a valid cluster
     */
    isValidCluster(first, second) {
        return this.canStartCluster(first) && this.canFollowInCluster(second);
    }

    /**
     * Get vowel type (leading, following, above, below)
     */
    getVowelPosition(char) {
        const leading = new Set(['เ', 'แ', 'โ', 'ใ', 'ไ']);
        const above = new Set(['ิ', 'ี', 'ึ', 'ื', '์']);
        const below = new Set(['ุ', 'ู']);
        const following = new Set(['ะ', 'า', 'ำ']);

        if (leading.has(char)) return 'LEADING';
        if (above.has(char)) return 'ABOVE';
        if (below.has(char)) return 'BELOW';
        if (following.has(char)) return 'FOLLOWING';
        return 'OTHER';
    }

    /**
     * Check if character is a vowel that appears before the consonant
     */
    isLeadingVowel(char) {
        return this.getVowelPosition(char) === 'LEADING';
    }

    /**
     * Normalize Thai text (handle complex characters)
     */
    normalize(text) {
        // Normalize Unicode combining characters
        let normalized = text.normalize('NFC');
        
        // Remove zero-width characters that might interfere
        normalized = normalized.replace(/[\u200B-\u200F\u2060\uFEFF]/g, '');
        
        return normalized;
    }

    /**
     * Split text into characters considering combining marks
     */
    splitToCharacters(text) {
        const chars = [];
        let i = 0;
        
        while (i < text.length) {
            let char = text[i];
            i++;
            
            // Collect combining marks
            while (i < text.length && this.isCombiningMark(text[i])) {
                char += text[i];
                i++;
            }
            
            chars.push(char);
        }
        
        return chars;
    }

    /**
     * Check if character is a combining mark
     */
    isCombiningMark(char) {
        const code = char.charCodeAt(0);
        return (code >= 0x0E31 && code <= 0x0E3A) || // Thai vowels and tone marks
               (code >= 0x0E47 && code <= 0x0E4E);   // Thai diacritics
    }

    /**
     * Get syllable structure pattern for a sequence of characters
     */
    getSyllablePattern(chars) {
        return chars.map(char => {
            const charClass = this.getCharClass(char);
            switch (charClass) {
                case 'CONSONANT': return 'C';
                case 'VOWEL': return 'V';
                case 'TONE': return 'T';
                case 'DIACRITIC': return 'D';
                default: return 'O';
            }
        }).join('');
    }

    /**
     * Check if a sequence follows Thai syllable structure rules
     */
    isValidSyllableStructure(pattern) {
        // Common Thai syllable patterns:
        // C, CV, CVC, CCV, CCVC, etc.
        const validPatterns = [
            /^C+$/,           // Consonant only
            /^C+V+$/,         // Consonant + Vowel
            /^C+V+C+$/,       // Consonant + Vowel + Consonant
            /^C+V+T+$/,       // Consonant + Vowel + Tone
            /^C+V+T+C+$/,     // Consonant + Vowel + Tone + Consonant
            /^V+$/,           // Vowel only (rare)
            /^V+C+$/          // Vowel + Consonant (rare)
        ];

        return validPatterns.some(pattern => pattern.test(pattern));
    }

    /**
     * Calculate phonological distance between characters
     */
    getPhonologicalDistance(char1, char2) {
        const class1 = this.getCharClass(char1);
        const class2 = this.getCharClass(char2);
        
        if (class1 !== class2) return 1.0;
        
        if (class1 === 'CONSONANT') {
            const consClass1 = this.getConsonantClass(char1);
            const consClass2 = this.getConsonantClass(char2);
            return consClass1 === consClass2 ? 0.3 : 0.7;
        }
        
        if (class1 === 'VOWEL') {
            const pos1 = this.getVowelPosition(char1);
            const pos2 = this.getVowelPosition(char2);
            return pos1 === pos2 ? 0.3 : 0.7;
        }
        
        return char1 === char2 ? 0.0 : 0.5;
    }
}

module.exports = ThaiUtils;
