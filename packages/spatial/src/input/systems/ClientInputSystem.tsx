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

import { useEffect } from 'react'
import { Mesh, MeshBasicMaterial, Object3D, Quaternion, Ray, Raycaster, Vector3 } from 'three'

import { getMutableState, getState, useHookstate, useMutableState } from '@etherealengine/hyperflux'

import { Object3DUtils } from '@etherealengine/common/src/utils/Object3DUtils'
import { isClient } from '@etherealengine/common/src/utils/getEnvironment'
import {
  getComponent,
  getMutableComponent,
  getOptionalComponent,
  hasComponent,
  setComponent
} from '@etherealengine/ecs/src/ComponentFunctions'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { Entity, UndefinedEntity } from '@etherealengine/ecs/src/Entity'
import { createEntity, removeEntity } from '@etherealengine/ecs/src/EntityFunctions'
import { defineQuery } from '@etherealengine/ecs/src/QueryFunctions'
import { defineSystem } from '@etherealengine/ecs/src/SystemFunctions'
import { InputSystemGroup } from '@etherealengine/ecs/src/SystemGroups'
import { EngineState } from '@etherealengine/spatial/src/EngineState'
import { EntityTreeComponent } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { Not } from 'bitecs'
import { CameraComponent } from '../../camera/components/CameraComponent'
import { NameComponent } from '../../common/NameComponent'
import { ObjectDirection } from '../../common/constants/Axis3D'
import { Physics, RaycastArgs } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { AllCollisionMask } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { PhysicsState } from '../../physics/state/PhysicsState'
import { SceneQueryType } from '../../physics/types/PhysicsTypes'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { GroupComponent } from '../../renderer/components/GroupComponent'
import { VisibleComponent } from '../../renderer/components/VisibleComponent'
import { BoundingBoxComponent } from '../../transform/components/BoundingBoxComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { XRSpaceComponent } from '../../xr/XRComponents'
import { XRState } from '../../xr/XRState'
import { XRUIComponent } from '../../xrui/components/XRUIComponent'
import { InputComponent } from '../components/InputComponent'
import { InputPointerComponent } from '../components/InputPointerComponent'
import {
  InputSourceAxesCapturedComponent,
  InputSourceButtonsCapturedComponent,
  InputSourceComponent
} from '../components/InputSourceComponent'
import normalizeWheel from '../functions/normalizeWheel'
import { ButtonStateMap, MouseButton, createInitialButtonState } from '../state/ButtonState'
import { InputState } from '../state/InputState'

function preventDefault(e) {
  e.preventDefault()
}

const preventDefaultKeyDown = (evt) => {
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
  if (evt.code === 'Tab') evt.preventDefault()
  // prevent DOM tab selection and spacebar/enter button toggling (since it interferes with avatar controls)
  if (evt.code === 'Space' || evt.code === 'Enter') evt.preventDefault()
}

export function updateGamepadInput(eid: Entity) {
  const inputSource = getComponent(eid, InputSourceComponent)
  const gamepad = inputSource.source.gamepad
  const buttons = inputSource.buttons as ButtonStateMap

  // log buttons
  // if (source.gamepad) {
  //   for (let i = 0; i < source.gamepad.buttons.length; i++) {
  //     const button = source.gamepad.buttons[i]
  //     if (button.pressed) console.log('button ' + i + ' pressed: ' + button.pressed)
  //   }
  // }

  if (!gamepad) return
  const gamepadButtons = gamepad.buttons
  if (gamepadButtons) {
    for (let i = 0; i < gamepadButtons.length; i++) {
      const button = gamepadButtons[i]
      if (!buttons[i] && (button.pressed || button.touched)) {
        buttons[i] = createInitialButtonState(button)
      }
      if (buttons[i] && (button.pressed || button.touched)) {
        if (!buttons[i].pressed && button.pressed) buttons[i].down = true
        buttons[i].pressed = button.pressed
        buttons[i].touched = button.touched
        buttons[i].value = button.value
      } else if (buttons[i]) {
        buttons[i].up = true
      }
    }
  }
}

const pointers = defineQuery([InputPointerComponent, InputSourceComponent, Not(XRSpaceComponent)])
const xrSpaces = defineQuery([XRSpaceComponent, TransformComponent])
const inputSources = defineQuery([InputSourceComponent])

const inputXRUIs = defineQuery([InputComponent, VisibleComponent, XRUIComponent])
const inputBoundingBoxes = defineQuery([InputComponent, VisibleComponent, BoundingBoxComponent])
const inputObjects = defineQuery([InputComponent, VisibleComponent, GroupComponent])

const rayRotation = new Quaternion()

const inputRaycast = {
  type: SceneQueryType.Closest,
  origin: new Vector3(),
  direction: new Vector3(),
  maxDistance: 1000,
  groups: getInteractionGroups(AllCollisionMask, AllCollisionMask),
  excludeRigidBody: undefined //
} as RaycastArgs

const inputRay = new Ray()
const raycaster = new Raycaster()
const bboxHitTarget = new Vector3()

const quat = new Quaternion()

const execute = () => {
  // update 2D screen-based (driven by pointer api) input sources
  const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
  for (const eid of pointers()) {
    const pointer = getComponent(eid, InputPointerComponent)
    const inputSource = getComponent(eid, InputSourceComponent)
    pointer.movement.copy(pointer.position).sub(pointer.lastPosition)
    pointer.lastPosition.copy(pointer.position)
    inputSource.raycaster.setFromCamera(pointer.position, camera)
    TransformComponent.position.x[eid] = raycaster.ray.origin.x
    TransformComponent.position.y[eid] = raycaster.ray.origin.y
    TransformComponent.position.z[eid] = raycaster.ray.origin.z
    rayRotation.setFromUnitVectors(ObjectDirection.Forward, raycaster.ray.direction)
    TransformComponent.rotation.x[eid] = rayRotation.x
    TransformComponent.rotation.y[eid] = rayRotation.y
    TransformComponent.rotation.z[eid] = rayRotation.z
    TransformComponent.rotation.w[eid] = rayRotation.w
    TransformComponent.dirtyTransforms[eid] = true
  }

  // update xr input sources
  const xrFrame = getState(XRState).xrFrame
  for (const eid of xrSpaces()) {
    const space = getComponent(eid, XRSpaceComponent)
    const pose = xrFrame?.getPose(space.space, space.baseSpace)
    if (pose) {
      TransformComponent.position.x[eid] = pose.transform.position.x
      TransformComponent.position.y[eid] = pose.transform.position.y
      TransformComponent.position.z[eid] = pose.transform.position.z
      TransformComponent.rotation.x[eid] = pose.transform.orientation.x
      TransformComponent.rotation.y[eid] = pose.transform.orientation.y
      TransformComponent.rotation.z[eid] = pose.transform.orientation.z
      TransformComponent.rotation.w[eid] = pose.transform.orientation.w
      TransformComponent.dirtyTransforms[eid] = true
    }
  }

  // assign input sources (InputSourceComponent) to input sinks (InputComponent)
  for (const sourceEid of inputSources()) {
    const capturedButtons = hasComponent(sourceEid, InputSourceButtonsCapturedComponent)
    const capturedAxes = hasComponent(sourceEid, InputSourceAxesCapturedComponent)

    if (!capturedButtons || !capturedAxes) {
      let assignedInputEntity = UndefinedEntity as Entity
      let hitDistance = Infinity

      const sourceRotation = TransformComponent.getWorldRotation(sourceEid, quat)
      inputRaycast.direction.copy(ObjectDirection.Forward).applyQuaternion(sourceRotation)
      TransformComponent.getWorldPosition(sourceEid, inputRaycast.origin).addScaledVector(inputRaycast.direction, -0.01)
      inputRaycast.excludeRigidBody = getOptionalComponent(Engine.instance.localClientEntity, RigidBodyComponent)?.body
      inputRay.set(inputRaycast.origin, inputRaycast.direction)

      // only heuristic is scene objects when in the editor
      if (getState(EngineState).isEditor) {
        raycaster.set(inputRaycast.origin, inputRaycast.direction)
        const objects = inputObjects()
          .map((eid) => getComponent(eid, GroupComponent))
          .flat()
        const hits = raycaster.intersectObjects<Object3D>(objects, true).sort((a, b) => a.distance - b.distance)

        if (hits.length && hits[0].distance < hitDistance) {
          const object = hits[0].object
          const parentObject = Object3DUtils.findAncestor(object, (obj) => obj.parent === Engine.instance.scene)
          if (parentObject?.entity) {
            assignedInputEntity = parentObject.entity
            hitDistance = hits[0].distance
          }
        }
      } else {
        // 1st heuristic is XRUI
        for (const eid of inputXRUIs()) {
          const xrui = getComponent(eid, XRUIComponent)
          const layerHit = xrui.hitTest(inputRay)
          if (
            !layerHit ||
            !layerHit.intersection.object.visible ||
            (layerHit.intersection.object as Mesh<any, MeshBasicMaterial>).material?.opacity < 0.01
          )
            continue
          if (layerHit.intersection.distance < hitDistance) {
            assignedInputEntity = eid
            hitDistance = layerHit.intersection.distance
          }
          break
        }

        const physicsWorld = getState(PhysicsState).physicsWorld

        // 2nd heuristic is physics colliders
        if (physicsWorld) {
          const hit = Physics.castRay(physicsWorld, inputRaycast)[0]
          if (hit && hit.distance < hitDistance) {
            assignedInputEntity = hit.entity
            hitDistance = hit.distance
          }
        }

        // 3rd heuristic is bboxes
        for (const entity of inputBoundingBoxes()) {
          const boundingBox = getComponent(entity, BoundingBoxComponent)
          const hit = inputRay.intersectBox(boundingBox.box, bboxHitTarget)
          if (hit) {
            const distance = inputRay.origin.distanceTo(bboxHitTarget)
            if (distance < hitDistance) {
              assignedInputEntity = entity
              hitDistance = distance
              break
            }
          }
        }
      }

      const sourceState = getMutableComponent(sourceEid, InputSourceComponent)
      if (!capturedButtons) sourceState.assignedButtonEntity.set(assignedInputEntity)
      if (!capturedAxes) sourceState.assignedAxesEntity.set(assignedInputEntity)
    }

    updateGamepadInput(sourceEid)
  }
}

const useNonSpatialInputSources = () => {
  useEffect(() => {
    const eid = createEntity()
    setComponent(eid, InputSourceComponent, {})
    setComponent(eid, NameComponent, 'InputSource-nonspatial')
    const inputSourceComponent = getComponent(eid, InputSourceComponent)

    const canvas = EngineRenderer.instance.renderer.domElement
    canvas.addEventListener('DOMMouseScroll', preventDefault, false)
    canvas.addEventListener('gesturestart', preventDefault)
    canvas.addEventListener('contextmenu', preventDefault)
    canvas.addEventListener('keydown', preventDefaultKeyDown, false)

    const onKeyEvent = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement
      // Сheck which excludes the possibility of controlling the avatar when typing in a text field
      if (element?.tagName === 'INPUT' || element?.tagName === 'SELECT' || element?.tagName === 'TEXTAREA') return

      const code = event.code
      const down = event.type === 'keydown'

      const buttonState = inputSourceComponent.buttons as ButtonStateMap
      if (down) buttonState[code] = createInitialButtonState()
      else if (buttonState[code]) buttonState[code].up = true
    }
    document.addEventListener('keyup', onKeyEvent)
    document.addEventListener('keydown', onKeyEvent)

    const handleTouchDirectionalPad = (event: CustomEvent): void => {
      const { stick, value }: { stick: 'LeftStick' | 'RightStick'; value: { x: number; y: number } } = event.detail
      if (!stick) return
      if (!inputSourceComponent) return
      const index = stick === 'LeftStick' ? 0 : 2
      const axes = inputSourceComponent.source.gamepad!.axes as number[]
      axes[index + 0] = value.x
      axes[index + 1] = value.y
    }
    document.addEventListener('touchstickmove', handleTouchDirectionalPad)

    // TODO: this implementation for scrolling seems buggy
    const onWheelEvent = (event: WheelEvent) => {
      const inputState = getState(InputState)
      const normalizedValues = normalizeWheel(event)
      const x = Math.sign(normalizedValues.spinX + Math.random() * 0.000001)
      const y = Math.sign(normalizedValues.spinY + Math.random() * 0.000001)
      inputState.scroll.x += x
      inputState.scroll.y += y
    }
    canvas.addEventListener('wheel', onWheelEvent, { passive: true, capture: true })

    return () => {
      canvas.removeEventListener('DOMMouseScroll', preventDefault, false)
      canvas.removeEventListener('gesturestart', preventDefault)
      canvas.removeEventListener('contextmenu', preventDefault)
      canvas.removeEventListener('keydown', preventDefaultKeyDown, false)
      document.removeEventListener('keyup', onKeyEvent)
      document.removeEventListener('keydown', onKeyEvent)
      document.removeEventListener('touchstickmove', handleTouchDirectionalPad)
      canvas.removeEventListener('wheel', onWheelEvent)
      removeEntity(eid)
    }
  }, [])
}

const useGamepadInputSources = () => {
  useEffect(() => {
    const addGamepad = (e: GamepadEvent) => {
      console.log('[ClientInputSystem] found gamepad', e.gamepad)
      const eid = createEntity()
      setComponent(eid, InputSourceComponent, { gamepad: e.gamepad })
      setComponent(eid, NameComponent, 'InputSource-gamepad-' + e.gamepad.id)
    }
    const removeGamepad = (e: GamepadEvent) => {
      console.log('[ClientInputSystem] lost gamepad', e.gamepad)
      NameComponent.entitiesByName['InputSource-gamepad-' + e.gamepad.id]?.forEach((eid) => {
        removeEntity(eid)
      })
    }
    window.addEventListener('gamepadconnected', addGamepad)
    window.addEventListener('gamepaddisconnected', removeGamepad)
    return () => {
      window.removeEventListener('gamepadconnected', addGamepad)
      window.removeEventListener('gamepaddisconnected', removeGamepad)
    }
  }, [])
}

const usePointerInputSources = (canvas = EngineRenderer.instance.renderer.domElement) => {
  const xrState = useHookstate(getMutableState(XRState))
  useEffect(() => {
    if (xrState.session.value) return // pointer input sources are automatically handled by webxr

    // TODO: follow this spec more closely https://immersive-web.github.io/webxr/#transient-input
    // const pointerEntities = new Map<number, Entity>()

    const emulatedInputSourceEntity = createEntity()
    setComponent(emulatedInputSourceEntity, InputSourceComponent, {})
    setComponent(emulatedInputSourceEntity, NameComponent, 'InputSource-emulated-pointer')
    setComponent(emulatedInputSourceEntity, InputPointerComponent, { pointerId: 0, canvas })
    const inputSourceComponent = getComponent(emulatedInputSourceEntity, InputSourceComponent)
    const pointerComponent = getComponent(emulatedInputSourceEntity, InputPointerComponent)

    /** Clear mouse events */
    const pointerButtons = ['PrimaryClick', 'AuxiliaryClick', 'SecondaryClick']
    const clearPointerState = () => {
      const state = inputSourceComponent.buttons as ButtonStateMap
      for (const button of pointerButtons) {
        const val = state[button]
        if (!val?.up && val?.pressed) state[button].up = true
      }
    }

    canvas.addEventListener('blur', clearPointerState)
    canvas.addEventListener('mouseleave', clearPointerState)
    const handleVisibilityChange = (event: Event) => {
      if (document.visibilityState === 'hidden') clearPointerState()
    }
    canvas.addEventListener('visibilitychange', handleVisibilityChange)

    const handleMouseClick = (event: MouseEvent) => {
      const down = event.type === 'mousedown' || event.type === 'touchstart'

      let button = MouseButton.PrimaryClick
      if (event.button === 1) button = MouseButton.AuxiliaryClick
      else if (event.button === 2) button = MouseButton.SecondaryClick

      const inputSourceComponent = getOptionalComponent(emulatedInputSourceEntity, InputSourceComponent)
      if (!inputSourceComponent) return

      const state = inputSourceComponent.buttons as ButtonStateMap

      if (down) state[button] = createInitialButtonState()
      else if (state[button]) state[button]!.up = true
    }

    const handleMouseMove = (event: MouseEvent) => {
      pointerComponent.position.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * -2 + 1
      )
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      pointerComponent.position.set(
        (touch.clientX / window.innerWidth) * 2 - 1,
        (touch.clientY / window.innerHeight) * -2 + 1
      )
    }

    canvas.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true })
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true })
    canvas.addEventListener('mouseup', handleMouseClick)
    canvas.addEventListener('mousedown', handleMouseClick)
    canvas.addEventListener('touchstart', handleMouseClick)
    canvas.addEventListener('touchend', handleMouseClick)

    return () => {
      canvas.removeEventListener('blur', clearPointerState)
      canvas.removeEventListener('mouseleave', clearPointerState)
      canvas.removeEventListener('visibilitychange', handleVisibilityChange)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseClick)
      canvas.removeEventListener('mousedown', handleMouseClick)
      canvas.removeEventListener('touchstart', handleMouseClick)
      canvas.removeEventListener('touchend', handleMouseClick)
      removeEntity(emulatedInputSourceEntity)
    }
  }, [xrState.session])
}

const useXRInputSources = () => {
  const xrState = useMutableState(XRState)

  useEffect(() => {
    const session = xrState.session.value
    if (!session) return

    const addInputSource = (source: XRInputSource) => {
      const eid = createEntity()
      setComponent(eid, InputSourceComponent, { source })
      setComponent(eid, EntityTreeComponent, {
        parentEntity:
          source.targetRayMode === 'tracked-pointer' ? Engine.instance.originEntity : Engine.instance.cameraEntity
      })
      setComponent(eid, TransformComponent)
      setComponent(eid, NameComponent, 'InputSource-handed:' + source.handedness + '-mode:' + source.targetRayMode)
    }

    const removeInputSource = (source: XRInputSource) => {
      const entity = InputSourceComponent.entitiesByInputSource.get(source)
      if (entity) removeEntity(entity)
    }

    if (session.inputSources) {
      for (const inputSource of session.inputSources) addInputSource(inputSource)
    }

    const onInputSourcesChanged = (event: XRInputSourceChangeEvent) => {
      event.added.map(addInputSource)
      event.removed.map(removeInputSource)
    }

    const onXRSelectStart = (event: XRInputSourceEvent) => {
      const inputSourceComponent = InputSourceComponent.entitiesByInputSource.get(event.inputSource)
      if (!inputSourceComponent) return
      const state = inputSourceComponent.buttons as ButtonStateMap
      state.PrimaryClick = createInitialButtonState()
    }
    const onXRSelectEnd = (event: XRInputSourceEvent) => {
      const inputSourceComponent = InputSourceComponent.entitiesByInputSource.get(event.inputSource)
      if (!inputSourceComponent) return
      const state = inputSourceComponent.buttons as ButtonStateMap
      if (!state.PrimaryClick) return
      state.PrimaryClick.up = true
    }

    session.addEventListener('inputsourceschange', onInputSourcesChanged)
    session.addEventListener('selectstart', onXRSelectStart)
    session.addEventListener('selectend', onXRSelectEnd)

    return () => {
      session.removeEventListener('inputsourceschange', onInputSourcesChanged)
      session.removeEventListener('selectstart', onXRSelectStart)
      session.removeEventListener('selectend', onXRSelectEnd)
    }
  }, [xrState.session])
}

const reactor = () => {
  if (!isClient) return null

  useNonSpatialInputSources()
  useGamepadInputSources()
  usePointerInputSources()
  useXRInputSources()

  return null
}

export const ClientInputSystem = defineSystem({
  uuid: 'ee.engine.input.ClientInputSystem',
  insert: { with: InputSystemGroup },
  execute,
  reactor
})
