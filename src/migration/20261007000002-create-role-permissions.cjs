'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      module_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      module_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      create_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      edit_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      view_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      delete_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('role_permissions');
  },
};
