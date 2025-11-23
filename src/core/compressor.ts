/**
 * Prompt compression utilities
 *
 * Reduces token usage while preserving semantic meaning
 */

export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Filler words that can be removed without losing meaning
 */
const FILLER_WORDS = [
  'very', 'really', 'quite', 'rather', 'somewhat', 'fairly',
  'just', 'actually', 'basically', 'literally', 'honestly',
  'simply', 'clearly', 'obviously', 'essentially', 'particularly',
];

/**
 * Common phrase replacements for compression
 */
const PHRASE_REPLACEMENTS: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'at this point in time': 'now',
  'for the purpose of': 'to',
  'in the event that': 'if',
  'a large number of': 'many',
  'a small number of': 'few',
  'on a regular basis': 'regularly',
  'in spite of': 'despite',
  'take into consideration': 'consider',
  'make a decision': 'decide',
  'give an answer': 'answer',
  'have the ability to': 'can',
  'in the near future': 'soon',
  'at the present time': 'now',
};

/**
 * Compressor class for reducing prompt token usage
 */
export class Compressor {
  /**
   * Compress a prompt based on the specified level
   *
   * @param prompt - The text to compress
   * @param level - Compression level (low, medium, high)
   * @returns Compressed prompt
   */
  static compress(prompt: string, level: CompressionLevel = 'medium'): string {
    let compressed = prompt;

    // All levels: normalize whitespace
    compressed = this.normalizeWhitespace(compressed);

    if (level === 'low') {
      return compressed;
    }

    // Medium and High: remove filler words and simplify phrases
    compressed = this.removeFillerWords(compressed);
    compressed = this.simplifyPhrases(compressed);

    if (level === 'medium') {
      return compressed;
    }

    // High: aggressive compression
    compressed = this.removeArticles(compressed);
    compressed = this.useContractions(compressed);
    compressed = this.abbreviateCommon(compressed);

    return compressed;
  }

  /**
   * Normalize whitespace (remove extra spaces, trim)
   */
  private static normalizeWhitespace(text: string): string {
    return text
      .replace(/[^\S\n]+/g, ' ')      // Multiple spaces to single (but not newlines)
      .replace(/\n\s*\n+/g, '\n')     // Multiple newlines to single newline
      .trim();
  }

  /**
   * Remove filler words that don't add meaning
   */
  private static removeFillerWords(text: string): string {
    const fillerPattern = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');
    return text.replace(fillerPattern, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Simplify common verbose phrases
   */
  private static simplifyPhrases(text: string): string {
    let simplified = text;

    for (const [verbose, concise] of Object.entries(PHRASE_REPLACEMENTS)) {
      const pattern = new RegExp(verbose, 'gi');
      simplified = simplified.replace(pattern, concise);
    }

    return simplified;
  }

  /**
   * Remove articles (a, an, the) where they're not critical
   */
  private static removeArticles(text: string): string {
    // Only remove articles that are not at the start of sentences
    // and not critical for meaning (heuristic approach)
    return text
      .replace(/\s+(a|an|the)\s+/gi, ' ')  // Remove mid-sentence articles
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Use contractions to reduce token count
   */
  private static useContractions(text: string): string {
    const contractions: Record<string, string> = {
      'do not': "don't",
      'does not': "doesn't",
      'did not': "didn't",
      'will not': "won't",
      'would not': "wouldn't",
      'should not': "shouldn't",
      'could not': "couldn't",
      'cannot': "can't",
      'are not': "aren't",
      'is not': "isn't",
      'was not': "wasn't",
      'were not': "weren't",
      'have not': "haven't",
      'has not': "hasn't",
      'had not': "hadn't",
      'I am': "I'm",
      'you are': "you're",
      'he is': "he's",
      'she is': "she's",
      'it is': "it's",
      'we are': "we're",
      'they are': "they're",
      'I have': "I've",
      'you have': "you've",
      'we have': "we've",
      'they have': "they've",
      'I will': "I'll",
      'you will': "you'll",
      'he will': "he'll",
      'she will': "she'll",
      'we will': "we'll",
      'they will': "they'll",
      'I would': "I'd",
      'you would': "you'd",
      'he would': "he'd",
      'she would': "she'd",
      'we would': "we'd",
      'they would': "they'd",
    };

    let contracted = text;

    for (const [phrase, contraction] of Object.entries(contractions)) {
      const pattern = new RegExp(`\\b${phrase}\\b`, 'gi');
      contracted = contracted.replace(pattern, contraction);
    }

    return contracted;
  }

  /**
   * Abbreviate common words
   */
  private static abbreviateCommon(text: string): string {
    const abbreviations: Record<string, string> = {
      'approximately': 'approx',
      'regarding': 're',
      'information': 'info',
      'example': 'e.g.',
      'because': 'bc',
      'without': 'w/o',
      'with': 'w/',
      'between': 'btw',
      'through': 'thru',
      'number': 'no.',
      'versus': 'vs',
    };

    let abbreviated = text;

    for (const [word, abbrev] of Object.entries(abbreviations)) {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      abbreviated = abbreviated.replace(pattern, abbrev);
    }

    return abbreviated;
  }

  /**
   * Calculate compression ratio
   *
   * @param original - Original text
   * @param compressed - Compressed text
   * @returns Compression ratio (0-1, where 0.25 means 25% reduction)
   */
  static getCompressionRatio(original: string, compressed: string): number {
    const originalLength = original.length;
    const compressedLength = compressed.length;

    if (originalLength === 0) return 0;

    const reduction = (originalLength - compressedLength) / originalLength;
    return Math.max(0, Math.min(1, reduction));
  }
}
