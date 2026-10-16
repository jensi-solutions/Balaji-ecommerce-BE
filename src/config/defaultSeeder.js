import bcrypt from 'bcryptjs';
import { Role, User, RolePermission, UserPermission } from '../models/index.js';

// Default e-commerce admin modules
const defaultModules = [
  'Dashboard',
  'Users',
  'Roles',
  'Permissions',
  'Products',
  'Categories',
  'Orders',
  'Payments',
  'Customers',
  'Coupons',
  'Reviews',
  'Settings',
];

const seedDefaultData = async () => {
  try {
    // 1. Check & create default Admin Role if empty
    const roleCount = await Role.count();
    let adminRoleId = 1;

    if (roleCount === 0) {
      const defaultRole = await Role.create({
        id: 1,
        role_name: 'Admin',
        default_role: true,
      });
      adminRoleId = defaultRole.id;
      console.log('🌱 Default role "Admin" created (ID: 1)');
    } else {
      const adminRole = await Role.findOne({ where: { role_name: 'Admin' } });
      if (adminRole) {
        adminRoleId = adminRole.id;
      }
    }

    // 2. Check & create default Admin User if empty
    let adminUser = await User.findOne({ where: { role_id: adminRoleId } });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);

      adminUser = await User.create({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@balaji.com',
        phone_number: '9876543210',
        password: hashedPassword,
        role_id: adminRoleId,
        active_status: true,
      });
      console.log(`🌱 Default admin user created (ID: ${adminUser.id}, Role ID: ${adminRoleId})`);
    }

    // 3. Seed Default Role Permissions for Admin
    for (const moduleName of defaultModules) {
      const existingRolePerm = await RolePermission.findOne({
        where: { role_id: adminRoleId, module_name: moduleName },
      });

      if (!existingRolePerm) {
        await RolePermission.create({
          role_id: adminRoleId,
          module_name: moduleName,
          module_access: true,
          create_access: true,
          edit_access: true,
          view_access: true,
          delete_access: true,
        });
      }
    }
    console.log(`🌱 Default RolePermissions verified for Admin Role (ID: ${adminRoleId})`);

    // 4. Seed Default User Permissions for Admin User
    if (adminUser) {
      for (const moduleName of defaultModules) {
        const existingUserPerm = await UserPermission.findOne({
          where: { user_id: adminUser.id, role_id: adminRoleId, module_name: moduleName },
        });

        if (!existingUserPerm) {
          await UserPermission.create({
            role_id: adminRoleId,
            user_id: adminUser.id,
            module_name: moduleName,
            module_access: true,
            create_access: true,
            edit_access: true,
            view_access: true,
            delete_access: true,
            is_extra: false,
            is_extra_create: false,
            is_extra_edit: false,
            is_extra_view: false,
            is_extra_delete: false,
          });
        }
      }
      console.log(`🌱 Default UserPermissions verified for Admin User (ID: ${adminUser.id})`);
    }
  } catch (error) {
    console.error('⚠️ Error seeding default data:', error.message);
  }
};

export default seedDefaultData;
