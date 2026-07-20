# Mini Social Feed App

A lightweight social media application built with **Supabase** (PostgreSQL + Auth) backend and **React Native (Expo)** mobile app. Users can post updates, interact with a shared feed through likes and comments, and receive real-time push notifications via **Expo Push Notifications** (FCM).

---

## 📁 Project Structure

```
social-app/
├── src/                          # React Native (Expo) mobile app
│   ├── app/                      # Expo Router screens & navigation
│   ├── components/               # Reusable UI components
│   ├── constants/                # App constants (colors, sizes, config)
│   ├── helpers/                  # Helper functions & utilities
│   ├── lib/                      # Third-party library configurations
│   ├── services/                 # API calls, auth, notifications
│   └── utils/                    # General utility functions
├── server/                       # Node.js + Express backend
│   ├── config/                   # Database, Firebase, environment config
│   ├── controllers/              # Route handlers & business logic
│   ├── middlewares/              # Auth, validation, error handling
│   ├── models/                   # Supabase queries & data access
│   ├── routes/                   # API route definitions
│   ├── utils/                    # Server-side utility functions
│   ├── validators/               # Joi validation schemas
│   └── server.js                 # Entry point
├── app.json                      # Expo configuration
├── package.json
└── README.md                     # This file
```

---

## 🚀 Live Deployment

| Service         | URL                                                           |
| --------------- | ------------------------------------------------------------- |
| **Backend API** | `https://social-app-d3of.onrender.com` _(deployed on Render)_ |

---

<!-- ## 🔧 Backend Setup

### Prerequisites

- Node.js >= 18.x
- Supabase account & project
- Expo account (for push notifications)

### Installation

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
EXPO_ACCESS_TOKEN=your_expo_access_token
```

> **Note:** Get your Supabase credentials from Project Settings → API.
> **Expo Access Token:** Generate from [Expo Dashboard](https://expo.dev/settings/access-tokens) for server-side push notification delivery.

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

--- -->

## 📡 API Documentation

### Authentication

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| `POST` | `/api/auth/signup` | Register a new user   |
| `POST` | `/api/auth/login`  | Login and receive JWT |

**Signup Request:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Login Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

### Posts

| Method   | Endpoint                     | Description                               | Auth |
| -------- | ---------------------------- | ----------------------------------------- | ---- |
| `POST`   | `/api/posts`                 | Create a new text post                    | Yes  |
| `GET`    | `/api/posts`                 | Fetch all posts (paginated, newest first) | No   |
| `GET`    | `/api/posts/:postId`         | Fetch a single post by ID                 | No   |
| `POST`   | `/api/posts/:postId/like`    | Like a post                               | Yes  |
| `DELETE` | `/api/posts/:postId/like`    | Unlike a post                             | Yes  |
| `POST`   | `/api/posts/:postId/comment` | Add a comment                             | Yes  |

**Create Post Request:**

```json
{
  "body": "Hello, this is my first post!"
}
```

**Fetch Posts Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 24,
      "created_at": "2026-07-19T05:52:16.35737+00:00",
      "body": "ertyuiop",
      "userId": "2c75e728-c154-4e0f-b3e7-62fcddcab5ce",
      "user": {
        "id": "2c75e728-c154-4e0f-b3e7-62fcddcab5ce",
        "name": "asanul"
      },
      "postLikes": [
        {
          "id": 21,
          "postId": 24,
          "userId": "2c75e728-c154-4e0f-b3e7-62fcddcab5ce",
          "created_at": "2026-07-19T11:12:29.337281+00:00"
        },
        {
          "id": 27,
          "postId": 24,
          "userId": "cc573a58-c3de-4f53-a9ce-ee315f3cd7b5",
          "created_at": "2026-07-19T11:22:33.215786+00:00"
        }
      ],
      "comments": [
        {
          "count": 3
        }
      ]
    }
  ]
}
```

---

### Notifications

| Method  | Endpoint                                      | Description                   | Auth |
| ------- | --------------------------------------------- | ----------------------------- | ---- |
| `POST`  | `/api/notifications`                          | Create a notification         | Yes  |
| `GET`   | `/api/notifications/:receiverId`              | Fetch user's notifications    | Yes  |
| `GET`   | `/api/notifications/unseen-count/:receiverId` | Get unseen notification count | Yes  |
| `PATCH` | `/api/notifications/:notificationId`          | Mark notification as read     | Yes  |

---

### Users

| Method | Endpoint                       | Description              | Auth |
| ------ | ------------------------------ | ------------------------ | ---- |
| `GET`  | `/api/users/:userId`           | Get user profile data    | Yes  |
| `POST` | `/api/users/registerPushToken` | Register Expo push token | Yes  |

---

<!-- ## 📱 Mobile App Setup

### Prerequisites

- Node.js >= 18.x
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (iOS/Android) or a **development build** (required for push notifications on Android SDK 53+)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=https://your-app.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
# Start Expo development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

> **⚠️ Push Notifications on Android:** Starting with Expo SDK 53, Android push notifications require a [development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go no longer supports remote notifications on Android. Use `expo-dev-client` and EAS Build for testing push notifications.

### Expo Plugins Configuration

Ensure your `app.json` includes all required plugins:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 76
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### Building for Production

```bash
# Install expo-dev-client for development builds
npx expo install expo-dev-client

# Create development build
npx expo prebuild
eas build --profile development

# Create production APK
npx expo prebuild
eas build --profile production --platform android
```

--- -->

## 🔔 Push Notification Flow

1. **User Login** — App requests push notification permissions via `expo-notifications`
2. **Token Registration** — On grant, app retrieves Expo Push Token
3. **Store Token** — Token is sent to backend via `POST /api/users/registerPushToken` and stored in Supabase
4. **Trigger Event** — When someone likes/comments on a post:
   - Backend creates a notification record in Supabase
   - Backend sends push via Expo Push Service using `expo-server-sdk`
   - Post author receives real-time push notification

---

## 🗄️ Database Schema (Supabase)

### Tables

| Table           | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `users`         | User accounts (managed by Supabase Auth + custom profile data) |
| `posts`         | Text posts with author reference                               |
| `likes`         | Many-to-many relationship between users and posts              |
| `comments`      | Comments on posts with author reference                        |
| `notifications` | Push notification records with read status                     |
| `push_tokens`   | Expo push tokens per user                                      |

---

## 🛡️ Security Features

- **JWT Authentication** — All protected routes require a valid Bearer token
- **Supabase Row Level Security (RLS)** — Database-level access control
- **Input Validation** — Schemas validate all request bodies, params, and queries
- **Password Hashing** — Handled by Supabase Auth (bcrypt)
- **CORS Enabled** — Configured for production frontend/mobile origins

---

<!-- ## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Mobile tests
npm test
```

--- -->

## 🛠️ Tech Stack

| Layer                  | Technology                             |
| ---------------------- | -------------------------------------- |
| **Backend**            | Node.js, Express                       |
| **Database**           | Supabase (PostgreSQL)                  |
| **Authentication**     | Supabase Auth, JWT                     |
| **Push Notifications** | Expo Push Notifications (FCM/APNs)     |
| **Validation**         | Zod                                    |
| **Mobile**             | React Native, Expo SDK 53, Expo Router |
| **State Management**   | React Context                          |
| **Styling**            | React Native StyleSheet                |

## 👤 Author

**Your Name**  
GitHub: [@neel-asanulhaquekiron](https://github.com/neel-asanulhaquekiron)  
Email: asanulhaquekiron@gmail.com

---

## 📄 License

This project is licensed under the MIT License.
