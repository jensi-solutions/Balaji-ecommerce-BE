# Balaji Backend API

Node.js + Express + MySQL + Sequelize Backend Setup.

---

## 📁 Project Structure

```text
Balaji-BE/
├── node_modules/
├── src/
│   ├── config/
│   │   └── db.config.js          # MySQL connection with Sequelize
│   ├── controllers/
│   │   └── user.controller.js    # Logic for User endpoints
│   ├── middlewares/
│   │   └── errorHandler.middleware.js # 404 & Global error handler
│   ├── models/
│   │   ├── index.js              # Sequelize models registry & associations
│   │   └── user.model.js         # User model schema
│   ├── routes/
│   │   ├── index.js              # Main API router (/api)
│   │   └── user.routes.js        # User route definitions (/api/users)
│   └── app.js                    # Express app initialization & middlewares
├── .env                          # Local environment variables
├── .env.example                  # Environment template
├── .gitignore
├── package.json
└── server.js                     # Server entry point & DB sync
```

---

## ⚙️ Setup & Configuration

1. **MySQL Database**:
   MySQL માં ડેટાબેઝ બનાવો:
   ```sql
   CREATE DATABASE balaji_db;
   ```

2. **`.env` File Settings**:
   `.env` ફાઇલમાં તમારા MySQL નું યુઝરનેમ અને પાસવર્ડ સેટ કરો:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=balaji_db
   DB_USER=root
   DB_PASSWORD=તમારો_પાસવર્ડ
   DB_DIALECT=mysql
   ```

---

## 🚀 Server Run કેવી રીતે કરવું

- **Development Mode (Auto-restart with Nodemon):**
  ```bash
  npm run dev
  ```

- **Production Mode:**
  ```bash
  npm start
  ```

---

## 🧪 Available Endpoints

- **Root:** `GET http://localhost:5000/`
- **Health Check:** `GET http://localhost:5000/api/health`
- **Get All Users:** `GET http://localhost:5000/api/users`
- **Create User:** `POST http://localhost:5000/api/users`
  ```json
  {
    "name": "Jensi",
    "email": "jensi@example.com",
    "role": "admin"
  }
  ```
- **Get User By ID:** `GET http://localhost:5000/api/users/:id`
