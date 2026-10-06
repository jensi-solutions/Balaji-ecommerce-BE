# Balaji Backend API

Node.js + Express + MySQL + Sequelize Backend Setup.

---

## 📁 Project Structure

```text
Balaji-BE/
├── src/
│   ├── config/
│   │   ├── config.js                  # Sequelize CLI configuration (.env aware)
│   │   ├── db.config.js               # MySQL connection with Sequelize
│   │   └── defaultSeeder.js           # Auto-seed Admin Role & User if 0 data
│   ├── controllers/
│   │   └── auth.controller.js         # User Login controller
│   ├── middlewares/
│   │   └── errorHandler.middleware.js # 404 & Global error handler
│   ├── migration/
│   │   ├── 20261006000000-create-roles.js # Roles table migration
│   │   └── 20261006000001-create-users.js # Users table migration (with role_id)
│   ├── models/
│   │   ├── index.js                   # Sequelize instance, models & associations
│   │   ├── role.model.js              # Role schema definition
│   │   └── user.model.js              # User schema definition
│   ├── routes/
│   │   ├── index.js                   # API Root router (/api)
│   │   └── auth.routes.js             # Auth routes (/api/auth)
│   └── app.js                         # Express app initialization & middlewares
├── .env                               # Environment variables (DB_NAME=balaji_ecommerce)
├── .env.example
├── .gitignore
├── .sequelizerc                       # Sequelize CLI path mappings
├── package.json
└── server.js                          # Server entry point, DB check & seeder
```

---

## ⚙️ Configuration (.env)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=balaji_ecommerce
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql

JWT_SECRET=balaji_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
```

---

## 🛠️ Migrations

- **Run Migrations:**
  ```bash
  npm run migrate
  ```

- **Rollback Last Migration:**
  ```bash
  npm run migrate:undo
  ```

---

## 🚀 Server Run

```bash
npm run dev
```

---

## 🔐 Auth API

### **User Login**
- **Endpoint:** `POST http://localhost:5000/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "admin@balaji.com",
    "password": "Admin@1234"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "uuid-here",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@balaji.com",
        "phone_number": "9876543210",
        "active_status": true,
        "role": {
          "id": 1,
          "role_name": "Admin"
        }
      }
    }
  }
  ```
