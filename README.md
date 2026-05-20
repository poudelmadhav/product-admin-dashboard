# Product Admin Dashboard

React admin dashboard for managing products, built with Firebase, MUI DataGrid, and Tailwind CSS. Features role-based access control (admin/viewer), real-time Firestore sync, inline editing, and Google sign-in.

## Tech Stack

- **React 19** + **Vite 8**
- **Firebase** (Auth, Firestore, Hosting)
- **MUI X DataGrid** (inline editing, filtering, export)
- **Tailwind CSS** (styling)

## Features

- Email/password and Google sign-in
- Role-based access (admin can CRUD, viewer is read-only)
- Real-time product list synced from Firestore
- Inline cell editing with auto-save
- Add, delete products (admin only)
- Search/filter products by name
- Role badge and read-only UI hints
- Dark theme with MUI integration

## Setup

```bash
npm install
```

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps.
2. Copy the `firebaseConfig` and paste into `src/firebase.js`.
3. Enable **Authentication** → Sign-in methods → **Email/Password** and **Google**.
4. Create **Firestore Database** (start in Production mode).
5. Deploy `firestore.rules` via CLI or paste into Firestore → Rules.

### Seed Data

1. Add a user in Authentication, note the UID.
2. Create Firestore document `users/{uid}` with `{ "email": "...", "role": "admin" }`.
3. Add sample products under `products/` collection.

### Run

```bash
npm run dev
```

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## File Structure

```
├── index.html
├── src/
│   ├── main.jsx            Entry point
│   ├── App.jsx             Root component
│   ├── AdminDashboard.jsx  Dashboard + login + CRUD
│   ├── firebase.js         Firebase init (Auth, Firestore, Analytics)
│   └── index.css           Tailwind directives + global styles
├── firestore.rules         Firestore security rules
├── tailwind.config.js
└── vite.config.js
```

## Security

| Action         | Viewer | Admin |
|----------------|:------:|:-----:|
| Read products  | ✅     | ✅    |
| Create product | ❌     | ✅    |
| Update product | ❌     | ✅    |
| Delete product | ❌     | ✅    |

Role checks are enforced server-side via Firestore Security Rules. The client-side role flag only controls UI visibility.
