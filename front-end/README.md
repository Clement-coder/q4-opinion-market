# Q4 Opinion Market — Frontend

React + Vite frontend for the Q4 Opinion Market platform.

---

## Stack

- **React 18** with React Router v6
- **Vite** build tool
- **Tailwind CSS** for styling
- **Firebase** for authentication
- **Supabase** for backend data

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install dependencies

```bash
cd front-end
npm install
```

### Environment variables

Create a `.env` file in the `front-end/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

---

## Project Structure

```
front-end/
├── public/           # Static assets
├── src/
│   ├── assets/       # Images and icons
│   ├── components/   # Shared UI components
│   ├── context/      # React context (Auth, Wallet)
│   ├── data/         # Static data and mock markets
│   ├── pages/        # Page components
│   └── services/     # External service integrations
├── index.html
└── vite.config.js
```

---

## Pages

| Route            | Page              | Description                          |
|------------------|-------------------|--------------------------------------|
| `/`              | Home              | Landing page with featured markets   |
| `/markets`       | Markets           | Browse all active prediction markets |
| `/how-it-works`  | How It Works      | Platform walkthrough                 |
| `/about`         | About             | About Q4 Opinion Market              |
| `/faq`           | FAQ               | Frequently asked questions           |
| `/login`         | Login             | Sign in                              |
| `/signup`        | Sign Up           | Create account                       |
| `/dashboard`     | Dashboard         | User positions and rewards           |
