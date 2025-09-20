// Type definitions for @deduq/thai-syllable-segmenter-crf
// Project: https://github.com/saalimon/ThaiSyllableSegmenter
// Definitions by: Your Name <https://github.com/yourusername>

export interface TrainingData {
  text: string;
  syllables: string[];
}

export interface CRFOptions {
  learningRate?: number;
  maxIterations?: number;
  regularization?: number;
  tolerance?: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  exactMatches: number;
  totalSamples: number;
}

export interface ModelInfo {
  loaded: boolean;
  numFeatures?: number;
  numLabels?: number;
  config?: CRFOptions;
}

export declare class ThaiSyllableSegmenter {
  constructor(options?: CRFOptions);
  
  /**
   * Train the segmenter with training data
   */
  train(trainingData: TrainingData[], options?: CRFOptions): Promise<void>;
  
  /**
   * Segment Thai text into syllables
   */
  segment(text: string): string[];
  
  /**
   * Segment multiple texts
   */
  segmentBatch(texts: string[]): string[][];
  
  /**
   * Save trained model to file
   */
  saveModel(filePath: string): Promise<void>;
  
  /**
   * Load trained model from file
   */
  loadModel(filePath: string): Promise<void>;
  
  /**
   * Evaluate model performance on test data
   */
  evaluate(testData: TrainingData[]): EvaluationMetrics;
  
  /**
   * Get model information
   */
  getModelInfo(): ModelInfo;
}

export declare class CRF {
  constructor(options?: CRFOptions);
  
  train(sequences: string[][][], labels: string[][]): void;
  predict(sequence: string[][]): string[];
  saveModel(): any;
  loadModel(modelData: any): void;
}

export declare class FeatureExtractor {
  constructor();
  
  extractFeatures(chars: string[], pos: number): string[];
  extractSequenceFeatures(text: string): {
    features: string[][];
    chars: string[];
  };
}

export declare class ThaiUtils {
  constructor();
  
  isThai(char: string): boolean;
  getCharClass(char: string): 'CONSONANT' | 'VOWEL' | 'TONE' | 'DIACRITIC' | 'DIGIT' | 'PUNCT' | 'OTHER_THAI' | 'NON_THAI';
  getConsonantClass(char: string): 'HIGH' | 'MIDDLE' | 'LOW' | 'NONE';
  canEndSyllable(char: string): boolean;
  canStartCluster(char: string): boolean;
  canFollowInCluster(char: string): boolean;
  isValidCluster(first: string, second: string): boolean;
  getVowelPosition(char: string): 'LEADING' | 'ABOVE' | 'BELOW' | 'FOLLOWING' | 'OTHER';
  isLeadingVowel(char: string): boolean;
  normalize(text: string): string;
  splitToCharacters(text: string): string[];
  getSyllablePattern(chars: string[]): string;
  isValidSyllableStructure(pattern: string): boolean;
  getPhonologicalDistance(char1: string, char2: string): number;
}

export { ThaiSyllableSegmenter, CRF, FeatureExtractor, ThaiUtils };
