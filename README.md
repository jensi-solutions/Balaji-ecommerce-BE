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

### **Forgot Password (Send OTP)**
- **Endpoint:** `POST http://localhost:5000/api/auth/forgot-password` (also `/forgot`)
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "admin@balaji.com"
  }
  ```

### **Verify Email OTP**
- **Endpoint:** `POST http://localhost:5000/api/auth/verify-otp` (also `/email-otp/verify`)
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "admin@balaji.com",
    "otp_code": "123456"
  }
  ```

### **Reset Password**
- **Endpoint:** `POST http://localhost:5000/api/auth/reset-password` (also `/reset`)
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "admin@balaji.com",
    "newPassword": "NewPassword@123",
    "confirmPassword": "NewPassword@123"
  }
  ```

### **Change Password**
- **Endpoint:** `POST http://localhost:5000/api/auth/change-password`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "current_password": "OldPassword@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }
  ```

### **User Logout**
- **Endpoint:** `POST http://localhost:5000/api/auth/logout`
- **Headers:** `Authorization: Bearer <TOKEN>`
- *(Invalidates the JWT token via blacklist)*

---

## 🛡️ Role Permissions APIs (`/api/role-permissions`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/role-permissions/create` | Create permissions for role | Bearer Token (Admin) |
| `PUT` | `/api/role-permissions/update/:role_id` | Update permissions & sync users | Bearer Token (Admin) |
| `GET` | `/api/role-permissions/all` | Get all role permissions (paginated) | Bearer Token |
| `GET` | `/api/role-permissions/:id` | Get role permission by ID | Bearer Token |
| `GET` | `/api/role-permissions/role/:role_id` | Get permissions by role_id | Bearer Token |

---

## 👤 User Permissions APIs (`/api/user-permissions`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/user-permissions/create` | Set user permissions (with `is_extra` overrides) | Bearer Token |
| `GET` | `/api/user-permissions/:user_id` | Get permissions for specific user | Bearer Token |
| `POST` | `/api/user-permissions/resetPermissionToDefault` | Reset user permissions back to role defaults | Bearer Token |

---

## 👥 User CRUD APIs (`/api/users`)

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/create` | `Users` -> `create_access` | Create user & clone default role permissions |
| `PUT` | `/api/users/update/:id` | `Users` -> `edit_access` | Update user by UUID |
| `DELETE` | `/api/users/:id` | `Users` -> `delete_access` | Soft-delete user & remove user permissions |
| `GET` | `/api/users/:id` | `Users` -> `view_access` | Get single user with permissions & full `profile_picture` URL |
| `GET` | `/api/users` | `Users` -> `view_access` | Get all users (paginated, searchable, full `profile_picture` URLs) |

> 📁 **File Uploads:** Uploaded profile pictures are automatically stored in `uploads/users/` and served statically at `http://localhost:5000/uploads/users/<filename>`. All user endpoints return the complete full-path URL in `profile_picture`.

---

## 🏭 Warehouse APIs (`/api/warehouses`)

### Endpoints

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/warehouses/create` | `Warehouse` -> `create_access` | Create a new warehouse |
| `PUT` | `/api/warehouses/update/:id` | `Warehouse` -> `edit_access` | Update warehouse details by UUID |
| `GET` | `/api/warehouses/all` | `Warehouse` -> `view_access` | Get all warehouses (paginated, searchable, status filter) |
| `GET` | `/api/warehouses/withoutFilter` | `Warehouse` -> `view_access` | Get all active warehouses without pagination |
| `GET` | `/api/warehouses/token` | Bearer Token | Get warehouse associated with authenticated maintainer |
| `GET` | `/api/warehouses/get/:id` (or `/:id`) | `Warehouse` -> `view_access` | Get single warehouse by UUID |
| `DELETE` | `/api/warehouses/delete/:id` (or `/:id`) | `Warehouse` -> `delete_access` | Soft-delete a warehouse by UUID |
| `POST` | `/api/warehouses/multiple/delete` | `Warehouse` -> `delete_access` | Bulk soft-delete warehouses by array of IDs |

### Maintainer Validation Rule
- The `warehouse_maintainer` field accepts an array of User IDs (UUID strings/numbers) or objects containing `id`/`user_id`.
- Every maintainer ID is validated against the `users` table:
  1. The user must exist in the database.
  2. The user must have **`role_id === 1`**.
  3. If any user is not found, a `404 Not Found` is returned.
  4. If any user does not have `role_id === 1`, a `400 Bad Request` is returned with: `"User with ID '<id>' does not have role_id 1. Only users with role_id 1 can be assigned as warehouse maintainers."`.

### Example Create / Update Payload
```json
{
  "warehouse_name": "Main Warehouse",
  "email": "warehouse@balaji.com",
  "phone_number": "9876543210",
  "phone_print": "9876543210",
  "address": "123 Industrial Area",
  "address_2": "Phase 1",
  "city": "Surat",
  "state": "Gujarat",
  "country": "India",
  "zip_code": "395001",
  "latitude": "21.1702",
  "longitude": "72.8311",
  "gst_no": "24AAAAA0000A1Z5",
  "fssai_code": "10012345678901",
  "warehouse_maintainer": ["e65d5069-b364-4e78-9e54-526bfcfbc2b5"],
  "online_order": true,
  "active_status": true
}
```

