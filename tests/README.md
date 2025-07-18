# Test Suite Structure

This document describes the testing strategy and structure for the MatchIt project.

## Test Categories

### Unit Tests
- Location: `tests/unit/`
- Purpose: Test individual components in isolation
- Files:
  - `models/`: Tests for data models
  - `services/`: Tests for business logic services

### Integration Tests  
- Location: `tests/integration/`
- Purpose: Test interactions between components
- Files:
  - `api/`: Tests for API endpoints and routes

### End-to-End Tests
- Location: `tests/e2e/`
- Purpose: Test complete user flows  
- Files:
  - `user-flows/`: Tests for critical user journeys

### Performance Tests
- Location: `tests/performance/`
- Purpose: Test system under load
- Files:
  - `load/`: Basic load testing
  - `stress/`: Stress testing scenarios

## Running Tests

Run all tests from project root:
```bash
npm test
```

Run specific test categories:
```bash
npm run test:unit
npm run test:integration
npm run test:e2e  
npm run test:performance
```

## Test Coverage
To generate coverage reports:
```bash
npm run test:coverage
```

## Best Practices
- Keep tests isolated and independent
- Use descriptive test names
- Clean up test data after each test
- Mock external dependencies in unit tests
