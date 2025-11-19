/**
 * Copy Quality Check
 * 
 * Analyzes marketing copy for clarity, readability, and effectiveness:
 * - Readability scores (Flesch-Kincaid)
 * - Jargon detection
 * - CTA text effectiveness
 * - Headline quality
 * 
 * Based on Monzo principle: "Straightforward Kindness" - clear, jargon-free communication
 */

export async function checkCopyQuality(page, config) {
  const issues = [];
  const measurements = {};
  
  try {
    // Extract all visible text content
    const textContent = await page.evaluate(() => {
      // Get all text nodes, excluding script/style
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Check if visible
            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      let text = '';
      let node;
      while (node = walker.nextNode()) {
        text += node.textContent + ' ';
      }
      
      return text.trim();
    });
    
    measurements.textLength = textContent.length;
    measurements.wordCount = textContent.split(/\s+/).length;
    
    // ==========================================
    // CHECK 1: Readability Score (Flesch-Kincaid)
    // ==========================================
    try {
      const readabilityScore = calculateFleschKincaid(textContent);
      measurements.readabilityScore = readabilityScore;
      
      const targetScore = config.thresholds?.fleschKincaid || 60;
      
      if (readabilityScore < targetScore) {
        issues.push({
          severity: config.severity?.['low-readability'] || 'warning',
          category: 'copy-quality',
          rule: 'readability-score',
          message: `Readability score: ${readabilityScore.toFixed(1)} (target: ${targetScore}+, reading level: ${getReadingLevel(readabilityScore)})`,
          recommendation: 'Simplify language:\n' +
                         '  - Use shorter sentences (avg 15-20 words)\n' +
                         '  - Choose common words over complex ones\n' +
                         '  - Break up long paragraphs\n' +
                         '  - Use active voice instead of passive',
          impact: 'Medium - Complex copy reduces comprehension and conversion',
          score: readabilityScore
        });
      }
    } catch (err) {
      console.warn('Readability check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 2: Jargon Detection
    // ==========================================
    try {
      const jargonList = config.jargonList || [
        'leverage', 'synergy', 'paradigm', 'optimize', 'utilize',
        'implement', 'facilitate', 'revolutionary', 'cutting-edge',
        'next-generation', 'innovative', 'solution', 'platform'
      ];
      
      const jargonWords = [];
      const words = textContent.toLowerCase().split(/\s+/);
      
      for (const jargon of jargonList) {
        const count = words.filter(w => w.includes(jargon.toLowerCase())).length;
        if (count > 0) {
          jargonWords.push({ word: jargon, count });
        }
      }
      
      measurements.jargonWords = jargonWords;
      
      const maxJargon = config.thresholds?.maxJargonWords || 5;
      const totalJargon = jargonWords.reduce((sum, j) => sum + j.count, 0);
      
      if (totalJargon > maxJargon) {
        issues.push({
          severity: config.severity?.['excessive-jargon'] || 'warning',
          category: 'copy-quality',
          rule: 'jargon-detection',
          message: `Found ${totalJargon} jargon words (max: ${maxJargon}): ${jargonWords.map(j => `${j.word} (${j.count})`).join(', ')}`,
          recommendation: 'Replace jargon with plain language:\n' +
                         jargonWords.map(j => `  - "${j.word}" → use simpler alternative`).join('\n'),
          impact: 'Medium - Jargon creates barrier to understanding',
          jargonFound: jargonWords
        });
      }
    } catch (err) {
      console.warn('Jargon check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 3: CTA Text Effectiveness
    // ==========================================
    try {
      const ctaTexts = await page.locator('button[data-cta], a[data-cta]').allTextContents();
      measurements.ctaTexts = ctaTexts;
      
      const weakCTAPatterns = [
        { pattern: /^submit$/i, suggestion: 'Be specific: "Download Free Checklist"' },
        { pattern: /^click here$/i, suggestion: 'Describe action: "Get Your Free Guide"' },
        { pattern: /^learn more$/i, suggestion: 'Be outcome-focused: "See How It Works"' },
        { pattern: /^read more$/i, suggestion: 'Create urgency: "Start Free Trial"' },
        { pattern: /^continue$/i, suggestion: 'Motivate action: "Claim Your Spot"' }
      ];
      
      const weakCTAs = [];
      for (const [index, text] of ctaTexts.entries()) {
        for (const { pattern, suggestion } of weakCTAPatterns) {
          if (pattern.test(text)) {
            weakCTAs.push({ text, suggestion, index });
          }
        }
      }
      
      if (weakCTAs.length > 0) {
        issues.push({
          severity: config.severity?.['weak-cta'] || 'suggestion',
          category: 'copy-quality',
          rule: 'action-oriented-ctas',
          message: `Weak CTAs found: ${weakCTAs.map(c => `"${c.text}"`).join(', ')}`,
          recommendation: 'Use action-oriented, benefit-focused CTA text:\n' +
                         weakCTAs.map(c => `  - "${c.text}" → ${c.suggestion}`).join('\n'),
          impact: 'Low-Medium - Specific CTAs convert 20-30% better',
          weakCTAs
        });
      }
    } catch (err) {
      console.warn('CTA text check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 4: Headline Quality
    // ==========================================
    try {
      const headlines = await page.locator('h1').allTextContents();
      measurements.headlines = headlines;
      
      const minWords = config.thresholds?.minHeadlineWords || 4;
      const maxWords = config.thresholds?.maxHeadlineWords || 12;
      
      for (const [index, headline] of headlines.entries()) {
        const wordCount = headline.trim().split(/\s+/).length;
        
        if (wordCount < minWords) {
          issues.push({
            severity: 'suggestion',
            category: 'copy-quality',
            rule: 'headline-clarity',
            message: `Headline too short (${wordCount} words): "${headline}"`,
            recommendation: `Expand headline to ${minWords}-${maxWords} words for clarity and SEO`,
            impact: 'Low - Short headlines may lack clarity'
          });
        }
        
        if (wordCount > maxWords) {
          issues.push({
            severity: 'suggestion',
            category: 'copy-quality',
            rule: 'headline-clarity',
            message: `Headline too long (${wordCount} words): "${headline.substring(0, 50)}..."`,
            recommendation: `Shorten headline to ${maxWords} words max for better impact`,
            impact: 'Low - Long headlines lose attention'
          });
        }
        
        // Check for benefit-oriented language
        const benefitWords = ['get', 'learn', 'discover', 'achieve', 'improve', 'save', 'grow'];
        const hasBenefit = benefitWords.some(word => headline.toLowerCase().includes(word));
        
        if (!hasBenefit && headline.length > 20) {
          issues.push({
            severity: 'suggestion',
            category: 'copy-quality',
            rule: 'headline-clarity',
            message: `Headline lacks benefit-focused language: "${headline}"`,
            recommendation: 'Frame headline around user benefit (Get, Learn, Discover, Achieve)',
            impact: 'Low - Benefit-driven headlines attract attention'
          });
        }
      }
    } catch (err) {
      console.warn('Headline check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 5: Sentence Length Analysis
    // ==========================================
    try {
      const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [];
      const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
      
      measurements.sentences = {
        count: sentences.length,
        avgLength: sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length,
        longest: Math.max(...sentenceLengths)
      };
      
      // Flag very long sentences
      const longSentences = sentenceLengths.filter(len => len > 30);
      if (longSentences.length > sentences.length * 0.2) {
        issues.push({
          severity: 'suggestion',
          category: 'copy-quality',
          rule: 'readability-score',
          message: `${longSentences.length} sentences exceed 30 words (${Math.round(longSentences.length / sentences.length * 100)}% of total)`,
          recommendation: 'Break long sentences into shorter ones for better readability',
          impact: 'Low - Long sentences reduce comprehension'
        });
      }
    } catch (err) {
      console.warn('Sentence analysis failed:', err.message);
    }
    
  } catch (error) {
    console.error('Copy quality check error:', error);
    issues.push({
      severity: 'warning',
      category: 'system',
      rule: 'copy-quality-check',
      message: `Copy quality check encountered an error: ${error.message}`,
      recommendation: 'Review page content accessibility',
      impact: 'Unknown'
    });
  }
  
  return {
    passed: issues.filter(i => ['critical', 'serious'].includes(i.severity)).length === 0,
    issues,
    measurements,
    summary: {
      total: issues.length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'suggestion').length
    }
  };
}

/**
 * Calculate Flesch-Kincaid Reading Ease Score
 * Score: 0-100 (higher = easier)
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 */
function calculateFleschKincaid(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.split(/\s+/);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  // Remove silent e
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  // Count vowel groups
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Get reading level description from Flesch-Kincaid score
 */
function getReadingLevel(score) {
  if (score >= 90) return '5th grade (very easy)';
  if (score >= 80) return '6th grade (easy)';
  if (score >= 70) return '7th grade (fairly easy)';
  if (score >= 60) return '8th-9th grade (standard)';
  if (score >= 50) return '10th-12th grade (fairly difficult)';
  if (score >= 30) return 'College (difficult)';
  return 'College graduate (very difficult)';
}

export default checkCopyQuality;

