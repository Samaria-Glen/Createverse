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

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual } from '@feathersjs/schema'
import { v4 } from 'uuid'

import { staticResourcePath, StaticResourceType } from '@etherealengine/engine/src/schemas/media/static-resource.schema'
import { AvatarDatabaseType, AvatarQuery, AvatarType } from '@etherealengine/engine/src/schemas/user/avatar.schema'
import type { HookContext } from '@etherealengine/server-core/declarations'

import { getDateTimeSql } from '../../util/get-datetime-sql'

export const avatarResolver = resolve<AvatarType, HookContext>({
  modelResource: virtual(async (avatar, context) => {
    //TODO: We should replace `as any as StaticResourceType` with `as StaticResourceType` once static-resource service is migrated to feathers 5.
    const modelStaticResource = (await context.app
      .service(staticResourcePath)
      .get(avatar.modelResourceId)) as any as StaticResourceType
    return modelStaticResource
  }),
  thumbnailResource: virtual(async (avatar, context) => {
    //TODO: We should replace `as any as StaticResourceType` with `as StaticResourceType` once static-resource service is migrated to feathers 5.
    const thumbnailStaticResource = (await context.app
      .service(staticResourcePath)
      .get(avatar.thumbnailResourceId)) as any as StaticResourceType
    return thumbnailStaticResource
  })
})

export const avatarExternalResolver = resolve<AvatarType, HookContext>({})

export const avatarDataResolver = resolve<AvatarDatabaseType, HookContext>({
  id: async () => {
    return v4()
  },
  createdAt: getDateTimeSql,
  updatedAt: getDateTimeSql
})

export const avatarPatchResolver = resolve<AvatarType, HookContext>({
  updatedAt: getDateTimeSql
})

export const avatarQueryResolver = resolve<AvatarQuery, HookContext>({})