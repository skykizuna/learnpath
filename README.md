# 📚 LearnPath

An AI-powered personalised learning platform built with **React + Vite**, **Firebase**, and **Google Gemini AI**. Students can set learning goals, generate AI roadmaps, chat with an AI tutor, join study communities, and track their progress with a gamification system.

---

## ✨ Features

- 🎯 **AI Learning Roadmaps** – Generate personalised study plans using Google Gemini
- 💬 **AI Tutor Chat** – Ask questions and get real-time tutoring support
- 📚 **PDF Study Document Categorisation** – Upload and automatically categorize study materials
- 🤖 **AI Tutor Personalities** – Chat with specialized AI tutors (e.g., Math Expert, General Tutor)
- 🏆 **Gamification** – Earn points, badges, streaks, and level up as you learn
- 👥 **Study Communities** – Create and join study groups, share posts and documents
- 📅 **Study Sessions** – Schedule and join collaborative study sessions
- 📈 **Leaderboard** – Compete and track rankings with other learners
- 🔐 **Authentication** – Email/password and Google Sign-In via Firebase Auth

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7 |
| UI Icons | Lucide React |
| Charts | Recharts |
| Backend / Auth | Firebase (Auth + Firestore + Storage) |
| AI | Google Gemini API |

---

## 🏗️ Technical Architecture

The platform follows a modern, scalable client-serverless architecture leveraging Firebase for backend services and Google Gemini for AI capabilities. 

### Frontend (React + Vite)
- **Component-based UI**: Built with React hooks (`useState`, `useEffect`) and highly modular components.
- **State Management**: React components manage user auth state, learning goals, and document uploads.
- **Styling**: Vanilla CSS (`index.css`, `App.css`) with Lucide React for iconography.
- **Build Tooling**: Vite for fast HMR (Hot Module Replacement) and optimized production builds.

### Backend (Firebase)
- **Authentication**: `firebase/auth` handling email/password and Google OAuth workflows.
- **Database**: Cloud Firestore using NoSQL collections for:
  - `users`: Profiles, study streaks, points, achievements.
  - `goals`: User-defined academic goals and generated roadmaps.
  - `communities` & `posts`: Study group interactions.
  - `sessions`: Scheduled automated study sessions.
- **Storage**: Firebase Storage for hosting student document uploads (PDFs, images).

### AI Integration
- **Gemini API**: Acts as the intelligence layer, dynamically incorporated via serverless calls (`geminiService.js`).
- Structured prompt engineering ensures deterministic JSON outputs for roadmaps and formatted Markdown for the AI Tutor.

---

## 🛠️ Implementation Details

### AI Learning Roadmaps
The goal generation system fetches the user's country and academic level, feeding it into the Gemini 2.0 Flash model. The prompt enforces a restrictive JSON output format, parsed on the frontend to create a 5-step trackable roadmap saved directly to Firestore.

### Context-Aware AI Tutor
The tutor feature passes user profile parameters (education level, grade, country) along with the current discussion context to Gemini. It conditionally alters its personality through the `tutorSpecialty` parameter (e.g., General Tutor, Math Expert) to provide culturally and academically relevant explanations.

### Gamification & Tracking
User progress is tracked through Firestore observer patterns. Completing goals or logging in consecutively updates the `streak` and increments user points. Badges are dynamically awarded upon reaching thresholds (e.g., "7 Day Streak", "First Goal Completed") using the `checkAndAwardAchievements` utility.

### Community & Study Groups
Real-time listeners (`onSnapshot`) synchronize study group posts and user statuses. Users can upload specific study materials to Firebase Storage, attaching download URLs to community discussion threads for peer collaborative learning. 

---

## 🚧 Challenges Faced

- **AI Formatting Inconsistencies**: The Gemini API occasionally returned Markdown formatting around JSON objects (e.g., \`\`\`json\`), which broke the roadmap generation. Implemented a robust RegExp cleanup step in `geminiService.js` to strip Markdown before parsing.
- **Real-time State Synchronization**: Ensuring gamification points and streaks updated instantaneously across different browser tabs required careful management of Firestore listeners and React effects.
- **Prompt Engineering Limitations**: Guiding the AI to provide age-appropriate, syllabus-aligned answers for varying educational systems required extensive prompt tuning to ensure instructions were strictly followed.

---

## 🗺️ Future Roadmap

- **Interactive Quizzes**: Implement AI-generated micro-quizzes based on uploaded documents to test user knowledge dynamically.
- **Video/Audio Chat Sessions**: Integrate WebRTC or a service like Agora for live peer-to-peer study sessions natively within the app.
- **Mobile Application**: Port the React web app to React Native for a dedicated iOS and Android experience with native push notifications.
- **Advanced Gamification**: Introduce seasonal leaderboards, customizable avatars, and in-game economy based on study hours.

---

## ⚙️ Prerequisites

Make sure you have these installed before getting started:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Git](https://git-scm.com/)
- A [Firebase](https://console.firebase.google.com/) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/skykizuna/learnpath.git
cd learnpath
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the **root** of the project:

```bash
# Firebase Configuration
# Get these from: Firebase Console > Project Settings > Your Apps > Web App
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini AI
# Get this from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **⚠️ Important:** Never commit `.env.local` to Git. It is already listed in `.gitignore`.

---

## 🌐 Running & Testing in the Browser

### Start the development server

```bash
npm run dev
```

Vite will start the server and show you a local URL, usually:

```
http://localhost:5173
```

Open that URL in your browser. The app supports **hot reload** — any changes you save will instantly reflect in the browser without needing to refresh.

### Other useful commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build the production bundle to `/dist` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## 🌿 Branching & Pushing Changes

We follow a standard **feature branch workflow**. Please do **not** push directly to `main`.

### Step-by-step: Making and pushing changes

#### 1. Make sure your local `main` is up to date

```bash
git checkout main
git pull origin main
```

#### 2. Create a new branch for your feature or fix

Use a descriptive name for your branch:

```bash
# For a new feature:
git checkout -b feature/your-feature-name

# For a bug fix:
git checkout -b fix/short-description

# Examples:
git checkout -b feature/dark-mode-toggle
git checkout -b fix/login-button-crash
```

#### 3. Make your changes

Edit files, write code, test in the browser with `npm run dev`.

#### 4. Stage and commit your changes

```bash
git add .
git commit -m "Brief description of what you changed"
```

Good commit messages are short and specific, e.g.:
- ✅ `Add dark mode toggle to settings page`
- ✅ `Fix login error when password is empty`
- ❌ `changes` or `update stuff`

#### 5. Push your branch to GitHub

```bash
git push origin feature/your-feature-name
```

#### 6. Open a Pull Request (PR)

1. Go to [github.com/skykizuna/learnpath](https://github.com/skykizuna/learnpath)
2. You'll see a banner: **"Compare & pull request"** — click it
3. Write a short description of your changes
4. Request a review from a teammate
5. Once approved, it will be merged into `main`

---

## 📁 Project Structure

```
learnpath/
├── public/               # Static assets
├── src/
│   ├── App.jsx           # Main app component (all views and logic)
│   ├── firebase.js       # Firebase initialization & config
│   ├── geminiService.js  # Google Gemini AI integration
│   ├── main.jsx          # React entry point
│   ├── App.css           # Component styles
│   └── index.css         # Global styles
├── .env.local            # ⚠️ Your secret keys (DO NOT commit this)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔑 Firebase Setup (for new contributors)

1. Go to [Firebase Console](https://console.firebase.google.com/) and open the project
2. Enable **Authentication** → Sign-in methods: **Email/Password** and **Google**
3. Enable **Firestore Database** (start in test mode or use production rules)
4. Enable **Storage** (for document uploads)
5. Go to **Project Settings** → **Your Apps** → copy the config values into your `.env.local`

---

## 🤝 Contributing Guidelines

- Always branch off `main` and open a Pull Request
- Keep commits small and focused on one thing
- Test your changes in the browser before pushing
- Do not commit `.env.local` or `node_modules/`
- Ask in the group chat if you're unsure about anything!
