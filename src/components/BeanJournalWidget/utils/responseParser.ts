/**
 * Utility functions for parsing finalAnswerPrompt responses
 */

import { ParsedResponse } from '../types';

/**
 * Attempts to parse a finalAnswerPrompt response from JSON format
 * @param text - The text to parse
 * @returns ParsedResponse object with success status and content
 */
export function parseFinalAnswerPrompt(text: string): ParsedResponse {
  try {
    const parsed = JSON.parse(text);
    if (parsed.finalAnswerPrompt) {
      return {
        success: true,
        content: parsed.finalAnswerPrompt
      };
    }
    return {
      success: false,
      content: text,
      error: 'No finalAnswerPrompt found in JSON'
    };
  } catch (error) {
    return {
      success: false,
      content: text,
      error: 'Invalid JSON format'
    };
  }
}

/**
 * Checks if content contains actual plan data (not just questions about plans)
 * @param content - The content to check
 * @returns boolean indicating if content contains structured plan information
 */
export function isPlanContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check for actual plan data patterns, not just questions
  const hasActualPlanData = (
    // Multi-plan format with dashes
    (lowerContent.includes('- ') && (lowerContent.includes('plan') || lowerContent.includes('pricing'))) ||
    // Single plan format
    /the .+ plan costs .+ and includes/i.test(content) ||
    // Plan list with prices in parentheses
    /- .+\(.+\):/i.test(content)
  );
  
  // Exclude questions about plans
  const isQuestion = (
    lowerContent.includes('what are') ||
    lowerContent.includes('tell me about') ||
    lowerContent.includes('explain') ||
    lowerContent.includes('?')
  );
  
  return hasActualPlanData && !isQuestion;
}

/**
 * Checks if content contains philosophy-related keywords
 * @param content - The content to check
 * @returns boolean indicating if content is philosophy-related
 */
export function isPhilosophyContent(content: string): boolean {
  const philosophyKeywords = [
    'philosophy', 'core philosophy', 'principles', 'values',
    'mission', 'vision', 'beliefs'
  ];
  
  const lowerContent = content.toLowerCase();
  return philosophyKeywords.some(keyword => lowerContent.includes(keyword));
}