import Sequelize from 'sequelize';
import sequelize from '../db.js';
import defineDocument from './document.js';
import defineTenant from './tenant.js';

const Document = defineDocument(sequelize, Sequelize.DataTypes);
const Tenant = defineTenant(sequelize, Sequelize.DataTypes);

Document.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant',
});
Tenant.hasMany(Document, {
  foreignKey: 'tenant_id',
  as: 'documents',
});

export { sequelize, Document, Tenant };
