/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { DataTypes, Model, Sequelize } from 'sequelize'

import { InstanceAuthorizedUserInterface, InstanceInterface } from '@etherealengine/common/src/dbmodels/Instance'

import { Application } from '../../../declarations'
import { createLocationModel } from '../../user/user/user.model'

export default (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const instance = sequelizeClient.define<Model<InstanceInterface>>(
    'instance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      roomCode: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING
      },
      channelId: {
        type: DataTypes.STRING
      },
      podName: {
        type: DataTypes.STRING
      },
      currentUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      ended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      assigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      assignedAt: {
        type: DataTypes.DATE
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )

  ;(instance as any).associate = (models: any): void => {
    ;(instance as any).belongsTo(createLocationModel(app), { foreignKey: { allowNull: true } })
    ;(instance as any).hasMany(models.bot, { foreignKey: { allowNull: true } })
    ;(instance as any).belongsToMany(models.user, { through: 'instance-authorized-user' })
    ;(instance as any).hasMany(createInstanceAuthorizedUserModel(app), { foreignKey: { allowNull: false } })
    ;(instance as any).hasMany(models.user_kick, { onDelete: 'cascade' })
  }
  return instance
}

export const createInstanceAuthorizedUserModel = (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const instanceAuthorizedUser = sequelizeClient.define<Model<InstanceAuthorizedUserInterface>>(
    'instance-authorized-user',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )

  ;(instanceAuthorizedUser as any).associate = (models: any): void => {
    ;(instanceAuthorizedUser as any).belongsTo(models.instance, { required: true, foreignKey: { allowNull: true } })
    ;(instanceAuthorizedUser as any).belongsTo(models.user, { required: true, foreignKey: { allowNull: true } })
  }
  return instanceAuthorizedUser
}