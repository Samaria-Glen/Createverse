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

import { NO_PROXY } from '@etherealengine/hyperflux'
import assert from 'assert'
import { destroyEngine } from '../../../../src/ecs/classes/Engine'
import { getMutableComponent, setComponent } from '../../../../src/ecs/functions/ComponentFunctions'
import { createEntity } from '../../../../src/ecs/functions/EntityFunctions'
import { SystemDefinitions } from '../../../../src/ecs/functions/SystemFunctions'
import { createEngine } from '../../../../src/initializeEngine'
import { InputSourceComponent } from '../../../../src/input/components/InputSourceComponent'
import { ButtonCleanupSystem } from '../../../../src/input/systems/ButtonCleanupSystem'
import { MockXRInputSource, MockXRSpace } from '../../../util/MockXR'
import { loadEmptyScene } from '../../../util/loadEmptyScene'

describe('ButtonCleanupSystem', () => {
  let focusCopy

  before(() => {
    focusCopy = document.hasFocus
    document.hasFocus = () => {
      return true
    }
  })

  after(() => {
    document.hasFocus = focusCopy
  })

  beforeEach(() => {
    createEngine()
    loadEmptyScene()
  })

  it('test button cleanup system', () => {
    const mockXRInputSource = new MockXRInputSource({
      handedness: 'left',
      targetRayMode: 'screen',
      targetRaySpace: new MockXRSpace() as XRSpace,
      gripSpace: undefined,
      gamepad: undefined,
      profiles: ['test'],
      hand: undefined
    }) as XRInputSource

    const entity = createEntity()
    setComponent(entity, InputSourceComponent, { source: mockXRInputSource })
    const inputSource = getMutableComponent(entity, InputSourceComponent)
    inputSource.buttons.set({
      '0': {
        down: true
      }
    } as any)

    const system = SystemDefinitions.get(ButtonCleanupSystem)!
    const execute = system.execute
    execute()

    const buttons = inputSource.buttons.get(NO_PROXY)
    assert(buttons['0'].down === false)
  })

  afterEach(() => {
    return destroyEngine()
  })
})