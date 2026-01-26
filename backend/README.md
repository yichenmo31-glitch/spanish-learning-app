# Spanish Learning Backend

This is the backend service for the Spanish learning application, providing user authentication and data storage functionality.

## Technologies Used

- Node.js
- Express
- PostgreSQL
- bcryptjs (for password hashing)
- jsonwebtoken (for authentication)
- cors (for cross-origin resource sharing)
- dotenv (for environment variables)

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

### Installation

1. **Install Node.js dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env` file in the root directory and add your configuration:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_database_password
   DB_NAME=spanish_learning
   DB_SSL=false

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Set up PostgreSQL database**

   - Create a new database called `spanish_learning`
   - Run the migration script to create the necessary tables:

   ```bash
   npm run migrate
   ```

### Running the Server

- **Development mode** (with nodemon):

  ```bash
  npm run dev
  ```

- **Production mode**:

  ```bash
  npm start
  ```

The server will run on port 3001 by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with existing credentials
- `GET /api/auth/me` - Get current user information (requires authentication)

### User Profile

- `PUT /api/profile/update` - Update user profile (requires authentication)
- `GET /api/profile/get` - Get user profile (requires authentication)

### Sessions

- `POST /api/session/create` - Create a new session (requires authentication)
- `GET /api/session/history` - Get user's session history (requires authentication)
- `GET /api/session/:sessionId` - Get details of a specific session (requires authentication)

### Vocabulary

- `POST /api/vocabulary/add` - Add a word to the notebook (requires authentication)
- `GET /api/vocabulary/notebook` - Get user's vocabulary notebook (requires authentication)
- `DELETE /api/vocabulary/delete/:word` - Remove a word from the notebook (requires authentication)

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### User Profiles Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `level` (VARCHAR(50) NOT NULL)
- `goal` (VARCHAR(50) NOT NULL)
- `coach` (VARCHAR(50) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Sessions Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `session_id` (VARCHAR(255) UNIQUE NOT NULL)
- `date` (TIMESTAMP NOT NULL)
- `level` (VARCHAR(50) NOT NULL)
- `goal` (VARCHAR(50) NOT NULL)
- `coach` (VARCHAR(50) NOT NULL)
- `duration` (VARCHAR(50) NOT NULL)
- `overview` (TEXT NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Chat Messages Table
- `id` (SERIAL PRIMARY KEY)
- `session_id` (INTEGER REFERENCES sessions(id) ON DELETE CASCADE)
- `message_id` (VARCHAR(255) NOT NULL)
- `sender` (VARCHAR(50) NOT NULL)
- `text` (TEXT NOT NULL)
- `translation` (TEXT)
- `timestamp` (TIMESTAMP NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Vocabulary Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `word` (VARCHAR(255) NOT NULL)
- `translation` (TEXT NOT NULL)
- `example` (TEXT NOT NULL)
- `example_translation` (TEXT)
- `pronunciation` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Session Vocabulary Table
- `id` (SERIAL PRIMARY KEY)
- `session_id` (INTEGER REFERENCES sessions(id) ON DELETE CASCADE)
- `word` (VARCHAR(255) NOT NULL)
- `translation` (TEXT NOT NULL)
- `example` (TEXT NOT NULL)
- `example_translation` (TEXT)
- `pronunciation` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Session Grammar Points Table
- `id` (SERIAL PRIMARY KEY)
- `session_id` (INTEGER REFERENCES sessions(id) ON DELETE CASCADE)
- `point` (TEXT NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Session Feedback Table
- `id` (SERIAL PRIMARY KEY)
- `session_id` (INTEGER REFERENCES sessions(id) ON DELETE CASCADE)
- `strengths` (TEXT[])
- `improvements` (TEXT[])
- `note` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
