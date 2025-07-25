# Tech Stack Details

## Backend Stack
- **Runtime**: Node.js (>= 16.0.0)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.16.1
- **Authentication**: jsonwebtoken + bcryptjs
- **File Processing**: 
  - PDF parsing: pdf-parse, pdfjs-dist
  - File uploads: Multer
- **Security**: Helmet, cors, express-rate-limit
- **Logging**: Winston + Morgan
- **Email**: Nodemailer
- **Validation**: express-validator, Joi
- **Testing**: Jest + Supertest
- **Dev Tools**: Nodemon, ESLint, Prettier

## Frontend Stack
- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.0
- **Routing**: React Router DOM 7.6.3
- **Styling**: 
  - Tailwind CSS 4.1.11
  - Material-UI (@mui) 7.2.0
  - Emotion for CSS-in-JS
- **State Management**: React Context API
- **Forms**: React Hook Form 7.60.0
- **HTTP Client**: Axios
- **Icons**: Lucide React + MUI Icons
- **Testing**: Vitest + React Testing Library
- **Dev Tools**: ESLint

## Module Systems
- Backend: CommonJS (`require`/`module.exports`)
- Frontend: ES Modules (`import`/`export`)