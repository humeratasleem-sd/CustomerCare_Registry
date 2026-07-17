const { COMPLAINT_PRIORITY } = require('../constants');
const ComplaintCategory = require('../models/ComplaintCategory');

/**
 * Heuristics-based Sentiment Analysis for Customer Feedback
 * @param {string} text Feedback message
 * @returns {string} 'Positive' | 'Neutral' | 'Negative'
 */
const analyzeSentiment = (text) => {
  if (!text) return 'Neutral';
  
  const content = text.toLowerCase();
  
  const positiveWords = [
    'great', 'good', 'excellent', 'awsome', 'awesome', 'amazing', 'happy', 'satisfied', 
    'fast', 'resolved', 'perfect', 'prompt', 'quick', 'polite', 'helpful', 'thank', 'thanks'
  ];
  const negativeWords = [
    'bad', 'slow', 'worst', 'terrible', 'horrible', 'unhappy', 'dissatisfied', 'useless', 
    'delay', 'broken', 'angry', 'error', 'rude', 'unhelpful', 'waste', 'frustrated', 'poor'
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) positiveScore += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) negativeScore += matches.length;
  });
  
  if (positiveScore > negativeScore) return 'Positive';
  if (negativeScore > positiveScore) return 'Negative';
  return 'Neutral';
};

/**
 * Heuristics-based Priority Prediction for Complaints
 * @param {string} title Complaint title
 * @param {string} description Complaint description
 * @returns {string} Priority constant
 */
const predictPriority = (title = '', description = '') => {
  const content = `${title.toLowerCase()} ${description.toLowerCase()}`;
  
  const criticalCues = ['security', 'breach', 'leak', 'hacked', 'fraud', 'steal', 'payment failure', 'double charge', 'crash', 'unable to access', 'production down', 'immediate attention'];
  const highCues = ['not working', 'broken', 'bug', 'error', 'fails', 'blocked', 'refund', 'overcharged', 'invoice missing', 'urgent', 'delay'];
  const lowCues = ['color', 'font', 'spacing', 'spelling', 'typo', 'feedback', 'how do i', 'question', 'inquiring', 'would like to see'];

  // Check critical cues
  if (criticalCues.some(cue => content.includes(cue))) {
    return COMPLAINT_PRIORITY.CRITICAL;
  }
  
  // Check high cues
  if (highCues.some(cue => content.includes(cue))) {
    return COMPLAINT_PRIORITY.HIGH;
  }
  
  // Check low cues
  if (lowCues.some(cue => content.includes(cue))) {
    return COMPLAINT_PRIORITY.LOW;
  }
  
  return COMPLAINT_PRIORITY.MEDIUM;
};

/**
 * Predict active category based on content analysis
 * @param {string} title Complaint title
 * @param {string} description Complaint description
 * @returns {Promise<mongoose.Types.ObjectId|null>} Category Document ID or null
 */
const predictCategory = async (title = '', description = '') => {
  try {
    const content = `${title.toLowerCase()} ${description.toLowerCase()}`;
    const categories = await ComplaintCategory.find({ isActive: true });
    
    if (categories.length === 0) return null;

    let bestCategory = categories[0]; // fallback
    let maxMatches = -1;

    const categoryKeywords = {
      'Billing': ['bill', 'invoice', 'charge', 'payment', 'refund', 'subscription', 'pricing', 'card', 'checkout', 'receipt', 'bank', 'charged'],
      'Technical Support': ['login', 'crash', 'code', 'error', 'api', 'server', 'slow', 'fail', 'bug', 'glitch', 'website', 'page', 'button', 'loading', 'down'],
      'Product Defect': ['break', 'scratch', 'damage', 'quality', 'defective', 'malfunction', 'missing part', 'deliver', 'unbox', 'physical', 'shape', 'color'],
      'General Inquiry': ['how to', 'help', 'question', 'questioning', 'features', 'policy', 'information', 'details', 'contact']
    };

    for (const cat of categories) {
      const keywords = categoryKeywords[cat.name] || [];
      let matches = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const count = (content.match(regex) || []).length;
        matches += count;
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    }

    // Only return if it had at least one keyword match, otherwise fallback to first active category
    return bestCategory._id;
  } catch (error) {
    console.error(`AI Category prediction error: ${error.message}`);
    return null;
  }
};

module.exports = {
  analyzeSentiment,
  predictPriority,
  predictCategory
};
