import { Sequelize } from 'sequelize';
import sequelize from '../config/db.config.js';
import User from './user.model.js';
import Role from './role.model.js';
import RolePermission from './rolePermission.model.js';
import UserPermission from './userPermission.model.js';
import Warehouse from './warehouse.model.js';
import Coupon from './coupon.model.js';
import Category from './category.model.js';
import Collection from './collection.model.js';
import Product from './product.model.js';
import ProductVariant from './productVariant.model.js';
import ProductCollection from './productCollection.model.js';

// User & Role Associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role & RolePermission Associations
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'role_permissions' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role & UserPermission Associations
Role.hasMany(UserPermission, { foreignKey: 'role_id', as: 'user_permissions' });
UserPermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User & UserPermission Associations
User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'user_permissions' });
UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category Self-Referencing Associations (Parent & Sub-categories)
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'sub_categories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent_category' });

// Category & Product Associations
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product & ProductVariant Associations
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product & Collection Many-to-Many Associations
Product.belongsToMany(Collection, {
  through: ProductCollection,
  foreignKey: 'product_id',
  otherKey: 'collection_id',
  as: 'collections',
});
Collection.belongsToMany(Product, {
  through: ProductCollection,
  foreignKey: 'collection_id',
  otherKey: 'product_id',
  as: 'products',
});
Product.hasMany(ProductCollection, { foreignKey: 'product_id', as: 'product_collections' });
ProductCollection.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Collection.hasMany(ProductCollection, { foreignKey: 'collection_id', as: 'collection_products' });
ProductCollection.belongsTo(Collection, { foreignKey: 'collection_id', as: 'collection' });

export {
  sequelize,
  Sequelize,
  User,
  Role,
  RolePermission,
  UserPermission,
  Warehouse,
  Coupon,
  Category,
  Collection,
  Product,
  ProductVariant,
  ProductCollection,
};


