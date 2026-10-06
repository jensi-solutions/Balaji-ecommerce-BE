import bcrypt from 'bcryptjs';
import { Role, User } from '../models/index.js';

const seedDefaultData = async () => {
  try {

    // 1. Check if roles table is empty
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

    // 2. Check if users table is empty
    const userCount = await User.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);

      await User.create({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@balaji.com',
        phone_number: '9876543210',
        password: hashedPassword,
        role_id: adminRoleId,
        active_status: true,
      });
      console.log(`🌱 Default admin user created (Role ID: ${adminRoleId})`);
    }
  } catch (error) {
    console.error('⚠️ Error seeding default data:', error.message);
  }
};

export default seedDefaultData;
