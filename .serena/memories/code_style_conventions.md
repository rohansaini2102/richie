# Code Style and Conventions

## General Conventions
- Use descriptive variable and function names
- Follow camelCase for variables and functions
- Use PascalCase for React components and classes
- Constants in UPPER_SNAKE_CASE

## Backend Conventions
- Module system: CommonJS (`require`/`module.exports`)
- File structure: Controllers, routes, models, services, middleware, utils
- Error handling: Try-catch blocks with proper logging
- Async operations: Use async/await pattern
- Logging: Use Winston logger for all logs
- Security: Always validate inputs, sanitize data

## Frontend Conventions
- Module system: ES Modules (`import`/`export`)
- Component structure: Functional components with hooks
- State management: React Context API for global state
- Styling: Tailwind CSS utility classes + Material-UI components
- File naming: PascalCase for components (e.g., `ClientList.jsx`)
- Hooks: Custom hooks prefixed with `use` (e.g., `useValidation`)
- Forms: React Hook Form for form handling
- API calls: Centralized in `services/api.js`

## Testing Conventions
- Backend: Jest for unit/integration tests
- Frontend: Vitest + React Testing Library
- Test files: `*.test.js` or `*.test.jsx`
- Test structure: Describe blocks with clear test names

## Git Conventions
- Clear, descriptive commit messages
- Present tense commits ("Add feature" not "Added feature")
- Reference issue numbers when applicable

## ESLint Rules
- No unused variables (except uppercase patterns in frontend)
- Consistent indentation (2 spaces)
- Semicolons required
- Single quotes for strings (unless containing quotes)