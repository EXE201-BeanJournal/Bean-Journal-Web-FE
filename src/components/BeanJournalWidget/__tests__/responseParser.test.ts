// /**
//  * Test suite for responseParser utility functions
//  * 
//  * To run these tests, ensure you have Jest and @testing-library/react installed:
//  * npm install --save-dev jest @testing-library/react @testing-library/jest-dom
//  */

// import { parseFinalAnswerPrompt, isPlanContent, isPhilosophyContent } from '../utils/responseParser';

// describe('responseParser', () => {
//   describe('parseFinalAnswerPrompt', () => {
//     it('should parse valid JSON with finalAnswerPrompt', () => {
//       const input = JSON.stringify({
//         finalAnswerPrompt: 'Test content'
//       });
      
//       const result = parseFinalAnswerPrompt(input);
      
//       expect(result.success).toBe(true);
//       expect(result.content).toBe('Test content');
//       expect(result.error).toBeUndefined();
//     });

//     it('should handle JSON without finalAnswerPrompt', () => {
//       const input = JSON.stringify({
//         otherField: 'Test content'
//       });
      
//       const result = parseFinalAnswerPrompt(input);
      
//       expect(result.success).toBe(false);
//       expect(result.content).toBe(input);
//       expect(result.error).toBe('No finalAnswerPrompt found in JSON');
//     });

//     it('should handle invalid JSON', () => {
//       const input = 'Invalid JSON string';
      
//       const result = parseFinalAnswerPrompt(input);
      
//       expect(result.success).toBe(false);
//       expect(result.content).toBe(input);
//       expect(result.error).toBe('Invalid JSON format');
//     });

//     it('should handle empty string', () => {
//       const result = parseFinalAnswerPrompt('');
      
//       expect(result.success).toBe(false);
//       expect(result.content).toBe('');
//       expect(result.error).toBe('Invalid JSON format');
//     });
//   });

//   describe('isPlanContent', () => {
//     it('should detect plan-related content', () => {
//       const planTexts = [
//         'Our pricing plan includes many features',
//         'The subscription cost is $10/month',
//         'This plan includes unlimited access',
//         'Monthly pricing options available'
//       ];
      
//       planTexts.forEach(text => {
//         expect(isPlanContent(text)).toBe(true);
//       });
//     });

//     it('should not detect non-plan content', () => {
//       const nonPlanTexts = [
//         'Welcome to our application',
//         'Here are some general information',
//         'Contact us for support'
//       ];
      
//       nonPlanTexts.forEach(text => {
//         expect(isPlanContent(text)).toBe(false);
//       });
//     });

//     it('should be case insensitive', () => {
//       expect(isPlanContent('PRICING PLAN')).toBe(true);
//       expect(isPlanContent('Plan Details')).toBe(true);
//     });
//   });

//   describe('isPhilosophyContent', () => {
//     it('should detect philosophy-related content', () => {
//       const philosophyTexts = [
//         'Our core philosophy is user-centric',
//         'Company values and principles',
//         'Our mission statement',
//         'Vision for the future'
//       ];
      
//       philosophyTexts.forEach(text => {
//         expect(isPhilosophyContent(text)).toBe(true);
//       });
//     });

//     it('should not detect non-philosophy content', () => {
//       const nonPhilosophyTexts = [
//         'Product features list',
//         'Pricing information',
//         'Technical documentation'
//       ];
      
//       nonPhilosophyTexts.forEach(text => {
//         expect(isPhilosophyContent(text)).toBe(false);
//       });
//     });

//     it('should be case insensitive', () => {
//       expect(isPhilosophyContent('CORE PHILOSOPHY')).toBe(true);
//       expect(isPhilosophyContent('Philosophy Statement')).toBe(true);
//     });
//   });
// });