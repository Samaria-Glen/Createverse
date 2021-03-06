// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models
module.exports = (sequelize, DataTypes) => {
  const { Sequelize } = sequelize;
  // This section contains the fields of your model, mapped to your table's columns.
  // Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
  const LocationSettings = sequelize.define('locationSettings', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    videoEnabled: {
      type: DataTypes.INTEGER,
    },
    instanceMediaChatEnabled: {
      type: DataTypes.INTEGER,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'location_settings',
  });

  // This section contains the relationships for this model. See: https://docs.forestadmin.com/documentation/v/v6/reference-guide/relationships#adding-relationships.
  LocationSettings.associate = (models) => {
    LocationSettings.belongsTo(models.locationType, {
      foreignKey: {
        name: 'locationTypeKey',
        field: 'locationType',
      },
      targetKey: 'type',
      as: 'locationType',
    });
    LocationSettings.belongsTo(models.location, {
      foreignKey: {
        name: 'locationIdKey',
        field: 'locationId',
      },
      as: 'location',
    });
  };

  return LocationSettings;
};
