# Balaji Backend API

Node.js + Express + MySQL + Sequelize Backend Setup.

---

## 📁 Project Structure

```text
Balaji-BE/
├── src/
│   ├── config/
│   │   └── db.config.js               # MySQL connection with Sequelize
│   ├── controllers/                   # Controllers (future implementation)
│   ├── middlewares/
│   │   └── errorHandler.middleware.js # 404 & Global error handler
│   ├── models/
│   │   └── index.js                   # Sequelize instance
│   ├── routes/
│   │   └── index.js                   # API Router (/api/health)
│   └── app.js                         # Express app initialization & middlewares
├── .env                               # Environment variables (DB_NAME=balaji_ecommerce)
├── .env.example
├── .gitignore
├── package.json
└── server.js                          # Server entry point & DB connection check
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
```

---

## 🚀 Server Run

```bash
npm run dev
```
અથવા
```bash
npm start
```
