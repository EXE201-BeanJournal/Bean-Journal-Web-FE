# BeanJournal Widget

A comprehensive chat widget for the BeanJournal application that intelligently displays different types of content including plans, features, and philosophy information.

## 🚀 Recent Improvements

### Code Quality Enhancements

1. **Shared Utility Functions** (`utils/responseParser.ts`)
   - Centralized parsing logic for `finalAnswerPrompt` responses
   - Reusable content detection functions
   - Consistent error handling across components

2. **Type Safety** (`types/index.ts`)
   - Comprehensive TypeScript interfaces
   - Better IDE support and compile-time error detection
   - Consistent prop types across components

3. **Error Boundaries** (`ErrorBoundary.tsx`)
   - Graceful error handling for component failures
   - Development-friendly error details
   - User-friendly fallback UI

4. **Testing Infrastructure** (`__tests__/`)
   - Unit tests for utility functions
   - Test examples for component testing
   - Jest configuration ready

## 📁 Project Structure

```
BeanJournalWidget/
├── ChatWidget.tsx          # Main chat interface
├── PlansDisplay.tsx        # Plan cards display
├── PhilosophyDisplay.tsx   # Philosophy content display
├── FeatureDisplay.tsx      # Features list display
├── ErrorBoundary.tsx       # Error handling wrapper
├── utils/
│   └── responseParser.ts   # Parsing utilities
├── types/
│   └── index.ts           # TypeScript definitions
├── __tests__/
│   └── responseParser.test.ts # Unit tests
└── README.md              # This file
```

## 🔧 Key Features

### Intelligent Content Detection
- Automatically detects plan, feature, and philosophy content
- Supports both JSON (`finalAnswerPrompt`) and text formats
- Fallback mechanisms for robust parsing

### Enhanced Error Handling
- Error boundaries prevent component crashes
- Graceful degradation for parsing failures
- Development-friendly error reporting

### Type Safety
- Comprehensive TypeScript interfaces
- Consistent prop validation
- Better IDE support and autocomplete

## 🧪 Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

Test coverage includes:
- Utility function validation
- Edge case handling
- Error scenarios

## 🛠 Usage Examples

### Basic Chat Widget

```tsx
import ChatWidget from './BeanJournalWidget/ChatWidget';

function App() {
  return (
    <ChatWidget 
      onClose={() => console.log('Widget closed')}
      initialMessage="Hello! How can I help you?"
    />
  );
}
```

### Custom Error Handling

```tsx
import ErrorBoundary from './BeanJournalWidget/ErrorBoundary';

function CustomComponent() {
  return (
    <ErrorBoundary fallback={<div>Custom error message</div>}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Using Utility Functions

```tsx
import { parseFinalAnswerPrompt, isPlanContent } from './utils/responseParser';

const response = parseFinalAnswerPrompt(jsonString);
if (response.success) {
  console.log('Parsed content:', response.content);
}

if (isPlanContent(messageText)) {
  // Display plan component
}
```

## 📋 Best Practices

### Component Development
1. Always wrap display components with `ErrorBoundary`
2. Use TypeScript interfaces from `types/index.ts`
3. Leverage utility functions for consistent parsing
4. Write unit tests for new functionality

### Error Handling
1. Provide meaningful fallback content
2. Log errors for debugging in development
3. Never crash the entire widget due to parsing errors

### Performance
1. Use React.memo for expensive components
2. Implement proper key props for list items
3. Consider lazy loading for large content

## 🔄 Migration Guide

If upgrading from previous versions:

1. **Import Changes**: Update imports to use new utility functions
2. **Type Safety**: Add TypeScript interfaces to your components
3. **Error Handling**: Wrap components with ErrorBoundary
4. **Testing**: Add unit tests using the provided examples

## 🐛 Troubleshooting

### Common Issues

1. **Parsing Failures**
   - Check if content follows expected JSON format
   - Verify `finalAnswerPrompt` field exists
   - Use fallback text parsing

2. **Component Not Rendering**
   - Verify content detection logic
   - Check ErrorBoundary for caught errors
   - Validate prop types

3. **Type Errors**
   - Ensure all imports use correct interfaces
   - Check prop type compatibility
   - Update TypeScript configuration if needed

## 🤝 Contributing

1. Follow existing code patterns
2. Add unit tests for new features
3. Update TypeScript interfaces as needed
4. Document any breaking changes

## 📝 Future Improvements

- [ ] Add internationalization support
- [ ] Implement component lazy loading
- [ ] Add accessibility improvements
- [ ] Create Storybook documentation
- [ ] Add E2E testing with Cypress