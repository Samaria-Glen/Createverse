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

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'

import Search from '../../common/Search'
import styles from '../../styles/admin.module.scss'
import ChannelDrawer, { ChannelDrawerMode } from './ChannelDrawer'
import ChannelTable from './ChannelTable'

const Channel = () => {
  const [openChannelDrawer, setOpenChannelDrawer] = useState(false)
  const [search, setSearch] = useState('')
  const { t } = useTranslation()

  const handleChange = (e: any) => {
    setSearch(e.target.value)
  }

  return (
    <div>
      <Grid container spacing={1} className={styles.mb10px}>
        <Grid item xs={12} sm={8}>
          <Search text="channel" handleChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            className={styles.openModalBtn}
            type="submit"
            variant="contained"
            onClick={() => setOpenChannelDrawer(true)}
          >
            {t('admin:components.channel.createChannel')}
          </Button>
        </Grid>
      </Grid>

      <ChannelTable className={styles.rootTableWithSearch} search={search} />

      <ChannelDrawer
        open={openChannelDrawer}
        mode={ChannelDrawerMode.Create}
        onClose={() => setOpenChannelDrawer(false)}
      />
    </div>
  )
}

export default Channel
