# Development Commands

## Backend Commands (run from /backend directory)
```bash
# Development
npm run dev              # Start development server with hot reload

# Production
npm start               # Start production server

# Testing
npm test                # Run all tests
npm run test-cas        # Run CAS parser tests specifically
npm run test-cas-init   # Initialize CAS parsing tests
npm run test-cas-files  # Test CAS file parsing

# Code Quality
npm run lint            # Run ESLint

# Database
npm run seed            # Seed database with initial data
```

## Frontend Commands (run from /frontend directory)
```bash
# Development
npm run dev             # Start Vite development server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test                # Run Vitest tests
npm run test:ui         # Run Vitest with UI

# Code Quality
npm run lint            # Run ESLint
```

## Git Commands
```bash
git status              # Check current changes
git diff                # View changes
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push                # Push to remote
```

## System Utilities (Linux)
```bash
ls -la                  # List files with details
find . -name "*.js"     # Find JavaScript files
grep -r "pattern" .     # Search for pattern in files
cd /path                # Change directory
pwd                     # Print working directory
```

## MongoDB (if installed locally)
```bash
mongod                  # Start MongoDB server
mongo                   # Open MongoDB shell
```