# Smart Scan Backend

Backend API for the Smart Scan mobile application.

## Features

- User registration and login
- Shopping history management
- Supabase integration
- RESTful API endpoints

## Deployment

### Render Deployment

1. **Push to GitHub** (make sure your repo is up to date)
2. **Create Render Account** at [render.com](https://render.com)
3. **Create New Web Service**
   - Connect your GitHub repository
   - Set **Root Directory**: `smart-scan-backend`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
4. **Add Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `NODE_ENV`: `production`

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3000
NODE_ENV=production
```

## API Endpoints

### Health Check
- `GET /` - Server status

### User Management
- `POST /register` - Register new user
- `POST /login` - User login

### Shopping History
- `POST /save-shopping-history` - Save shopping session
- `GET /shopping-history/:userId` - Get user's shopping history

## Local Development

```bash
cd smart-scan-backend
npm install
npm run dev
```

Server will run on `http://localhost:3000`

## Dependencies

- Express.js - Web framework
- @supabase/supabase-js - Database client
- cors - Cross-origin resource sharing
- body-parser - Request body parsing