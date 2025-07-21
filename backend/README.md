# Personal Autism & Psychology Assistant - Backend API

A Node.js + Express backend API for the Personal Autism & Psychology Assistant application with MongoDB integration.

## Features

- **User Management**: Complete CRUD operations for users with role-based access (patient, doctor, admin)
- **Patient Profiles**: Detailed patient information management
- **Session Management**: Track therapy sessions between patients and doctors
- **Reports**: Generate and manage session reports
- **Notifications**: User notification system
- **Action Logs**: Comprehensive activity logging
- **Security**: Rate limiting, CORS, Helmet security headers
- **Validation**: Input validation using Joi
- **UUID Support**: Uses UUID instead of MongoDB ObjectId for primary keys

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcryptjs for password hashing
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit
- **Environment**: dotenv

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update the `.env` file with your MongoDB connection string and other configurations

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users (with pagination and filtering)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Patient Profiles
- `GET /api/patient-profiles` - Get all patient profiles
- `GET /api/patient-profiles/:userId` - Get patient profile by user ID
- `POST /api/patient-profiles` - Create patient profile
- `PUT /api/patient-profiles/:userId` - Update patient profile

### Sessions
- `GET /api/sessions` - Get all sessions (with filtering)
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report

### Notifications
- `GET /api/notifications/:userId` - Get notifications for user
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/:id/read` - Mark notification as read

### Action Logs
- `GET /api/action-logs` - Get action logs (with filtering)
- `POST /api/action-logs` - Create new action log

## Database Schema

The application uses 6 main collections:

1. **users** - User accounts with roles (patient, doctor, admin)
2. **patient_profiles** - Extended patient information
3. **sessions** - Therapy sessions between patients and doctors
4. **reports** - Session reports and summaries
5. **notifications** - User notifications
6. **action_logs** - System activity logs

## Development

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Health Check

Visit `http://localhost:3000/health` to check if the API is running.

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS enabled
- Helmet security headers
- Password hashing with bcrypt
- Input validation and sanitization
- Environment variable protection

## Environment Variables

See `.env.example` for required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT secret for future authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
