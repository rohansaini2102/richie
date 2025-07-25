# Task Completion Checklist

When completing any development task, ensure you:

## 1. Code Quality Checks
- [ ] Run linting in affected directories:
  - Backend: `cd backend && npm run lint`
  - Frontend: `cd frontend && npm run lint`
- [ ] Fix any linting errors or warnings
- [ ] Ensure code follows project conventions

## 2. Testing
- [ ] Write/update tests for new functionality
- [ ] Run existing tests to ensure nothing breaks:
  - Backend: `cd backend && npm test`
  - Frontend: `cd frontend && npm test`
- [ ] Test manually in browser for UI changes

## 3. Documentation
- [ ] Update relevant documentation if needed
- [ ] Add JSDoc comments for new functions/components
- [ ] Update API documentation for new endpoints

## 4. Security Review
- [ ] Check for any hardcoded credentials
- [ ] Validate all user inputs
- [ ] Ensure proper authentication/authorization
- [ ] Review for XSS, SQL injection vulnerabilities

## 5. Performance
- [ ] Check for unnecessary re-renders (React)
- [ ] Optimize database queries if applicable
- [ ] Review bundle size impact for frontend changes

## 6. Version Control
- [ ] Review changes with `git diff`
- [ ] Stage appropriate files with `git add`
- [ ] Write clear commit message
- [ ] Push changes when ready

## 7. Environment Variables
- [ ] Update .env.example if new env vars added
- [ ] Document any new configuration requirements