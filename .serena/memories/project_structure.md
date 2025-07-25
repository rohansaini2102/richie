# Project Directory Structure

## Root Directory
```
richeai-master/
├── backend/           # Node.js Express API server
├── frontend/          # React Vite application
├── docs/              # Project documentation
├── photo/             # Image assets
├── .serena/           # Serena MCP configuration
├── .gitignore
├── cas2.pdf           # Sample CAS file
├── cas-monitor.js     # CAS monitoring utility
└── setup_enhanced_tracking.sh
```

## Backend Structure
```
backend/
├── controllers/       # Request handlers
│   ├── advisorController.js
│   ├── clientController.js
│   ├── OnboardingCASController.js
│   ├── planController.js
│   └── adminController.js
├── middleware/        # Express middleware
│   ├── auth.js
│   ├── requestLogger.js
│   └── serverSetup.js
├── models/            # MongoDB schemas
│   ├── Advisor.js
│   ├── Client.js
│   ├── ClientInvitation.js
│   └── FinancialPlan.js
├── routes/            # API routes
│   ├── admin.js
│   ├── auth.js
│   ├── clients.js
│   ├── logging.js
│   └── plans.js
├── services/          # Business logic
│   ├── cas-parser/    # CAS file parsing
│   └── claudeAiService.js
├── utils/             # Utilities
├── validators/        # Input validation
├── uploads/           # File uploads
├── index.js           # Entry point
└── package.json
```

## Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── components/    # React components
│   │   ├── client/    # Client management
│   │   ├── planning/  # Financial planning
│   │   ├── dashboard/ # Dashboard components
│   │   ├── layout/    # Layout components
│   │   └── modals/    # Modal dialogs
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── utils/         # Utilities
│   ├── App.jsx        # Main app component
│   └── main.jsx       # Entry point
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Key Entry Points
- Backend: `/backend/index.js`
- Frontend: `/frontend/src/main.jsx`
- API Base URL: Usually `http://localhost:5000` (backend)
- Frontend Dev: Usually `http://localhost:5173` (Vite)