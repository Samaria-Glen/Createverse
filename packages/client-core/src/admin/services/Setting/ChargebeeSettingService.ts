import { client } from '../../../feathers'
import { AlertService } from '../../../common/services/AlertService'
import { useDispatch, store } from '../../../store'
import { ChargebeeSettingResult } from '@xrengine/common/src/interfaces/ChargebeeSettingResult'
import { createState, DevTools, useState, none, Downgraded } from '@hookstate/core'
import { ChargebeeSetting } from '@xrengine/common/src/interfaces/ChargebeeSetting'

const state = createState({
  Chargebee: {
    chargebee: [] as Array<ChargebeeSetting>,
    updateNeeded: true
  }
})

store.receptors.push((action: ChargebeeSettingActionType): any => {
  let result
  state.batch((s) => {
    switch (action.type) {
      case 'CHARGEBEE_SETTING_DISPLAY':
        result = action.chargebeeSettingResult
        return s.Chargebee.merge({ chargebee: result.data, updateNeeded: false })
    }
  }, action.type)
})

export const accessChargebeeSettingState = () => state

export const useChargebeeSettingState = () => useState(state) as any as typeof state

//Service
export const ChargebeeSettingService = {
  fetchChargeBee: async () => {
    const dispatch = useDispatch()
    {
      try {
        const chargeBee = await client.service('chargebee-setting').find()
        dispatch(ChargebeeSettingAction.fetchedChargebee(chargeBee))
      } catch (err) {
        AlertService.dispatchAlertError(err.message)
      }
    }
  }
}

//Action
export const ChargebeeSettingAction = {
  fetchedChargebee: (chargebeeSettingResult: ChargebeeSettingResult) => {
    return {
      type: 'CHARGEBEE_SETTING_DISPLAY' as const,
      chargebeeSettingResult: chargebeeSettingResult
    }
  }
}

export type ChargebeeSettingActionType = ReturnType<typeof ChargebeeSettingAction[keyof typeof ChargebeeSettingAction]>
