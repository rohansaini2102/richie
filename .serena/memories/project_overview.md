# RichieAI Project Overview

## Project Purpose
RichieAI (RICHIEAT) is a comprehensive financial advisory platform designed for SEBI-registered financial advisors in India. The platform enables advisors to manage clients, parse financial documents (CAS files), and create personalized financial plans.

## Architecture
- **Type**: Full-stack web application
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing

## Key Features
1. **Advisor Management**: Registration, authentication, profile management
2. **Client Management**: Invitation system, onboarding forms, client data management
3. **CAS Parsing**: Multi-format support (CDSL, NSDL, CAMS, Karvy)
4. **Financial Planning**: 
   - Cash flow planning
   - Goal-based planning
   - Debt management
5. **Security**: JWT auth, rate limiting, XSS protection, comprehensive logging
6. **Admin Dashboard**: System monitoring and administrative controls

## Project Status
- 90% complete - Core features ready
- Production-ready authentication
- Comprehensive logging system implemented
- Multi-format CAS parsing operational
- Email invitation system working