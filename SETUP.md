# Admin Dashboard — Setup Guide

## 1. Install Dependencies

```bash
npm install firebase @mui/x-data-grid @mui/material @emotion/react @emotion/styled
```

> **Note:** `@mui/x-data-grid` v7+ requires `@mui/material` as a peer dependency.

---

## 2. Configure Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → General → "Your apps".
2. Copy the `firebaseConfig` object and paste it into `firebase.js`, replacing the placeholder values.

```js
// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## 3. Enable Firebase Services

In the Firebase Console:
- **Authentication** → Sign-in method → Enable **Email/Password**.
- **Firestore Database** → Create database (start in Production mode).

---

## 4. Deploy Firestore Security Rules

Paste the contents of `firestore.rules` into:
**Firebase Console → Firestore → Rules**

Or deploy via CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Seed Initial Data

### Create an Admin user

1. Firebase Console → Authentication → Add user (e.g. `admin@example.com`).
2. Note the **UID** from the Users table.
3. Firestore → Create collection **`users`** → Document ID = `{uid}`:
   ```json
   {
     "email": "admin@example.com",
     "role": "admin"
   }
   ```

### Create a Read-only user

1. Add another user (e.g. `viewer@example.com`).
2. Create a `users/{uid}` document **without** `role: "admin"` (or set `role: "viewer"`).

### Add sample products

Firestore → Create collection **`products`** → Add documents:
```json
{ "name": "Widget Pro",  "price": 29.99 }
{ "name": "Gadget Plus", "price": 49.99 }
{ "name": "Doohickey",   "price": 9.99  }
```

---

## 6. Add to Your App

```jsx
// App.jsx
import AdminDashboard from "./AdminDashboard";

export default function App() {
  return <AdminDashboard />;
}
```

Make sure Tailwind CSS is configured in your `vite.config.js` / `tailwind.config.js` as normal.

---

## File Structure

```
src/
├── firebase.js          ← Firebase init (Auth + Firestore)
├── AdminDashboard.jsx   ← Main component (this file)
└── App.jsx              ← Mount point

firestore.rules          ← Deploy to Firebase
```

---

## How Auto-Save Works

```
User double-clicks cell
    → DataGrid enters edit mode
    → User types new value
    → User presses Enter / Tab / clicks away
    → DataGrid calls processRowUpdate(newRow, oldRow)
        → validatePrice()
        → updateDoc(doc(db, "products", id), { name, price, updatedAt })
        → Toast: "Widget Pro saved."
    → If Firestore rejects (permission denied) → Toast error + row rolls back
```

---

## Security Model

| Action         | Regular User | Admin (role=="admin") |
|----------------|:------------:|:---------------------:|
| Read products  | ✅           | ✅                    |
| Update product | ❌           | ✅                    |
| Create product | ❌           | ✅                    |
| Delete product | ❌           | ✅                    |

The role check happens **server-side in Firestore Rules** — the client-side `isAdmin` flag only controls UI visibility, not actual data access. Even if a user tampers with the client, Firestore will reject unauthorized writes.
