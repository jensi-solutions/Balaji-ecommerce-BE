import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    main_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    multiple_images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    paranoid: true, // Soft delete enabled (deleted_at)
    underscored: true,
    tableName: 'products',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Product;
