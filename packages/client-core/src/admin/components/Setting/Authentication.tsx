import { Icon } from '@iconify/react'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSwitch from '@etherealengine/client-core/src/common/components/InputSwitch'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { initialAuthState } from '../../../common/initialAuthState'
import { NotificationService } from '../../../common/services/NotificationService'
import { AuthState } from '../../../user/services/AuthService'
import { AuthSettingsService, AuthSettingsState } from '../../services/Setting/AuthSettingService'
import styles from '../../styles/settings.module.scss'

const OAUTH_TYPES = {
  DISCORD: 'discord',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
  GOOGLE: 'google',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter'
}

const Account = () => {
  const { t } = useTranslation()

  const authSettingState = useHookstate(getMutableState(AuthSettingsState))
  const [authSetting] = authSettingState?.authSettings?.get({ noproxy: true }) || []
  const id = authSetting?.id
  const state = useHookstate(initialAuthState)
  const holdAuth = useHookstate(initialAuthState)
  const keySecret = useHookstate({
    discord: authSetting?.oauth.discord,
    github: authSetting?.oauth.github,
    google: authSetting?.oauth.google,
    twitter: authSetting?.oauth.twitter,
    linkedin: authSetting?.oauth.linkedin,
    facebook: authSetting?.oauth.facebook
  })
  const showPassword = useHookstate({
    discord: {
      key: false,
      secret: false
    },
    facebook: {
      key: false,
      secret: false
    },
    github: {
      appid: false,
      key: false,
      secret: false
    },
    google: {
      key: false,
      secret: false
    },
    linkedin: {
      key: false,
      secret: false
    },
    twitter: {
      key: false,
      secret: false
    }
  })

  const handleShowPassword = (key) => {
    const [social, value] = key.split('-')
    showPassword.set({
      ...JSON.parse(JSON.stringify(showPassword.value)),
      [social]: {
        ...JSON.parse(JSON.stringify(showPassword[social].value)),
        [value]: !JSON.parse(JSON.stringify(showPassword[social][value].value))
      }
    })
  }

  const user = useHookstate(getMutableState(AuthState).user)

  useEffect(() => {
    if (user?.id?.value && authSettingState?.updateNeeded?.value) {
      AuthSettingsService.fetchAuthSetting()
    }
  }, [user?.id?.value, authSettingState?.updateNeeded?.value])

  useEffect(() => {
    if (authSetting) {
      const temp = { ...initialAuthState }
      authSetting?.authStrategies?.forEach((el) => {
        Object.entries(el).forEach(([strategyName, strategy]) => {
          temp[strategyName] = strategy
        })
      })
      state.set(temp)
      holdAuth.set(temp)

      const tempKeySecret = JSON.parse(
        JSON.stringify({
          discord: authSetting?.oauth.discord,
          github: authSetting?.oauth.github,
          google: authSetting?.oauth.google,
          twitter: authSetting?.oauth.twitter,
          linkedin: authSetting?.oauth.linkedin,
          facebook: authSetting?.oauth.facebook
        })
      )
      keySecret.set(tempKeySecret)
    }
  }, [authSettingState?.updateNeeded?.value])

  const handleSubmit = () => {
    const auth = Object.keys(state.value)
      .filter((item) => (state[item].value ? item : null))
      .filter(Boolean)
      .map((prop) => ({ [prop]: state[prop].value }))

    const oauth = { ...authSetting.oauth, ...keySecret.value }

    for (const key of Object.keys(oauth)) {
      oauth[key] = JSON.stringify(oauth[key])
    }

    AuthSettingsService.patchAuthSetting({ authStrategies: JSON.stringify(auth), oauth: JSON.stringify(oauth) }, id)
    NotificationService.dispatchNotify(t('admin:components.setting.authSettingsRefreshNotification'), {
      variant: 'warning'
    })
  }

  const handleCancel = () => {
    const temp = { ...initialAuthState }
    authSetting?.authStrategies?.forEach((el) => {
      Object.entries(el).forEach(([strategyName, strategy]) => {
        temp[strategyName] = strategy
      })
    })

    const tempKeySecret = JSON.parse(
      JSON.stringify({
        discord: authSetting?.oauth.discord,
        github: authSetting?.oauth.github,
        google: authSetting?.oauth.google,
        twitter: authSetting?.oauth.twitter,
        linkedin: authSetting?.oauth.linkedin,
        facebook: authSetting?.oauth.facebook
      })
    )
    keySecret.set(tempKeySecret)
    state.set(temp)
  }

  const handleOnChangeAppId = (event, type) => {
    keySecret.set({
      ...JSON.parse(JSON.stringify(keySecret.value)),
      [type]: {
        ...JSON.parse(JSON.stringify(keySecret[type].value)),
        appid: event.target.value
      }
    })
  }

  const handleOnChangeKey = (event, type) => {
    keySecret.set({
      ...JSON.parse(JSON.stringify(keySecret.value)),
      [type]: {
        ...JSON.parse(JSON.stringify(keySecret[type].value)),
        key: event.target.value
      }
    })
  }

  const handleOnChangeSecret = (event, type) => {
    keySecret.set({
      ...JSON.parse(JSON.stringify(keySecret.value)),
      [type]: {
        ...JSON.parse(JSON.stringify(keySecret[type].value)),
        secret: event.target.value
      }
    })
  }

  const onSwitchHandle = (event) => {
    state.set({ ...JSON.parse(JSON.stringify(state.value)), [event.target.name]: event.target.checked })
  }

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.authentication')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6}>
          <InputText
            name="service"
            label={t('admin:components.setting.service')}
            value={authSetting?.service || ''}
            disabled
          />

          <InputText
            name="secret"
            label={t('admin:components.setting.secret')}
            value={authSetting?.secret || ''}
            disabled
          />

          <InputText
            name="entity"
            label={t('admin:components.setting.entity')}
            value={authSetting?.entity || ''}
            disabled
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.authStrategies')}</Typography>

          <Grid container>
            <Grid item xs={12} sm={6} md={6}>
              {Object.keys(state.value)
                .splice(0, Math.ceil(Object.keys(state.value).length / 2))
                .map((strategyName, i) => (
                  <InputSwitch
                    key={i}
                    name={strategyName}
                    label={strategyName}
                    checked={state[strategyName].value}
                    disabled={strategyName === 'jwt'}
                    onChange={onSwitchHandle}
                  />
                ))}
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              {Object.keys(state.value)
                .splice(
                  Object.keys(state.value).length % 2 === 1
                    ? -Math.ceil(Object.keys(state.value).length / 2) + 1
                    : -Math.ceil(Object.keys(state.value).length / 2)
                )
                .map((strategyName, i) => (
                  <InputSwitch
                    key={i}
                    name={strategyName}
                    label={strategyName}
                    checked={state[strategyName].value}
                    disabled={strategyName === 'jwt'}
                    onChange={onSwitchHandle}
                  />
                ))}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={12}>
          <Typography component="h1" className={styles.settingsHeading}>
            {t('admin:components.setting.oauth')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.defaults')}</Typography>

          <InputText
            name="host"
            label={t('admin:components.setting.host')}
            value={authSetting?.oauth?.defaults?.host || ''}
            disabled
          />

          <InputText
            name="protocol"
            label={t('admin:components.setting.protocol')}
            value={authSetting?.oauth?.defaults?.protocol || ''}
            disabled
          />

          {holdAuth?.discord?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.discord')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.discord?.key || ''}
                type={showPassword.value.discord.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('discord-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.discord.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.DISCORD)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.discord?.secret || ''}
                type={showPassword.value.discord.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('discord-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.discord.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.DISCORD)}
              />

              <InputText
                name="callbackGithub"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.discord || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.facebook?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.facebook')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.facebook?.key || ''}
                type={showPassword.value.facebook.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('facebook-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.facebook.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.FACEBOOK)}
              />

              <InputText
                name="key"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.facebook?.secret || ''}
                type={showPassword.value.facebook.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('facebook-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.facebook.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.FACEBOOK)}
              />

              <InputText
                name="callbackFacebook"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.facebook || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.github?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.github')}</Typography>

              <InputText
                name="appid"
                label={t('admin:components.setting.appId')}
                value={keySecret?.value?.github?.appid || ''}
                type={showPassword.value.github.appid ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('github-appid')}
                    icon={
                      <Icon
                        icon={showPassword.value.github.appid ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeAppId(e, OAUTH_TYPES.GITHUB)}
              />

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.github?.key || ''}
                type={showPassword.value.github.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('github-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.github.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.GITHUB)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.github?.secret || ''}
                type={showPassword.value.github.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('github-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.github.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.GITHUB)}
              />

              <InputText
                name="callbackGithub"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.github || ''}
                disabled
              />
            </>
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          {holdAuth?.google.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.google')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.google?.key || ''}
                type={showPassword.value.google.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('google-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.google.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.GOOGLE)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.google?.secret || ''}
                type={showPassword.value.google.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('google-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.google.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.GOOGLE)}
              />

              <InputText
                name="callbackGoogle"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.google || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.linkedin?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.linkedIn')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.linkedin?.key || ''}
                type={showPassword.value.linkedin.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('linkedin-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.linkedin.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.LINKEDIN)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.linkedin?.secret || ''}
                type={showPassword.value.linkedin.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('linkedin-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.linkedin.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.LINKEDIN)}
              />

              <InputText
                name="callbackLinkedin"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.linkedin || ''}
                disabled
              />
            </>
          )}
          {holdAuth?.twitter?.value && (
            <>
              <Typography className={styles.settingsSubHeading}>{t('admin:components.setting.twitter')}</Typography>

              <InputText
                name="key"
                label={t('admin:components.setting.key')}
                value={keySecret?.value?.twitter?.key || ''}
                type={showPassword.value.twitter.key ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('twitter-key')}
                    icon={
                      <Icon
                        icon={showPassword.value.twitter.key ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'}
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeKey(e, OAUTH_TYPES.TWITTER)}
              />

              <InputText
                name="secret"
                label={t('admin:components.setting.secret')}
                value={keySecret?.value?.twitter?.secret || ''}
                type={showPassword.value.twitter.secret ? 'text' : 'password'}
                endAdornment={
                  <IconButton
                    onClick={() => handleShowPassword('twitter-secret')}
                    icon={
                      <Icon
                        icon={
                          showPassword.value.twitter.secret ? 'ic:baseline-visibility' : 'ic:baseline-visibility-off'
                        }
                        color="orange"
                      />
                    }
                  />
                }
                onChange={(e) => handleOnChangeSecret(e, OAUTH_TYPES.TWITTER)}
              />

              <InputText
                name="callbackTwitter"
                label={t('admin:components.setting.callback')}
                value={authSetting?.callback?.twitter || ''}
                disabled
              />
            </>
          )}
        </Grid>
      </Grid>
      <Button sx={{ maxWidth: '100%' }} className={styles.outlinedButton} onClick={handleCancel}>
        {t('admin:components.common.cancel')}
      </Button>
      <Button sx={{ maxWidth: '100%', ml: 1 }} className={styles.gradientButton} onClick={handleSubmit}>
        {t('admin:components.common.save')}
      </Button>
    </Box>
  )
}

export default Account
