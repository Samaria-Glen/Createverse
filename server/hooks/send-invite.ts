import {HookContext, Params} from '@feathersjs/feathers'
import {
  extractLoggedInUserFromParams,
  getInviteLink,
  sendEmail,
  sendSms
} from '../services/auth-management/auth-management.utils'
import * as path from 'path'
import {BadRequest} from "@feathersjs/errors";
import * as pug from "pug";
import config from '../config'
import Invite from '../../server/models/invite.model'

// This will attach the owner ID in the contact while creating/updating list item
export default () => {
  return async (context: HookContext) => {
    try {
      // Getting logged in user and attaching owner of user
      const {app, result, params} = context

      let token = ''
      let identityProvider
      if (result.identityProviderType === 'email' || result.identityProviderType === 'sms') {
        token = result.token
      } else {
        token = result.inviteeId
      }
      const inviteType = result.inviteType

      const authProvider = extractLoggedInUserFromParams(params)
      const authUser = await app.service('user').get(authProvider.userId)

      console.log(result.identityProviderType)
      if (result.identityProviderType === 'email') {
        await generateEmail(
            app,
            result,
            token,
            inviteType,
            authUser.name
        )
      } else if (result.identityProviderType === 'sms') {
        await generateSMS(
            app,
            result,
            token,
            inviteType,
            authUser.name
        )
      } else if (result.inviteeId != null) {
        const existingRelationshipStatus = await app.service('user-relationship').find({
          query: {
            userRelationshipType: result.inviteType,
            userId: result.userId,
            relatedUserId: result.inviteeId
          }
        })
        if ((existingRelationshipStatus as any).total === 0) {
          await app.service('user-relationship').create({
            userRelationshipType: result.inviteType,
            userId: result.userId,
            relatedUserId: result.inviteeId
          }, {})
        }

        const emailIdentityProviderResult = await app.service('identity-provider').find({
          query: {
            userId: result.inviteeId,
            type: 'email'
          }
        })

        console.log('EMAILIDENTITYPROVIDER')
        console.log(emailIdentityProviderResult)

        if (emailIdentityProviderResult.total > 0) {
          await generateEmail(
              app,
              result,
              emailIdentityProviderResult.data[0].token,
              inviteType,
              authUser.name
          )
        } else {
          const SMSIdentityProviderResult = await app.service('identity-provider').find({
            query: {
              userId: result.inviteeId,
              type: 'sms'
            }
          })

          console.log('SMSIDENTITYPROVIDER')
          console.log(SMSIdentityProviderResult)

          if (SMSIdentityProviderResult.total > 0) {
            await generateSMS(
                app,
                result,
                SMSIdentityProviderResult.data[0].token,
                inviteType,
                authUser.name
            )
          }
        }
      }

      return context
    } catch(err) {
      console.log(err)
    }
  }
}

async function generateEmail (
    app: any,
    result: any,
    toEmail: string,
    inviteType: string,
    inviterUsername: string
): Promise<void> {
  const hashLink = getInviteLink(inviteType, result.id, result.passcode)
  const appPath = path.dirname(require.main ? require.main.filename : '')
  const emailAccountTemplatesPath = path.join(
      appPath,
      '..',
      'server',
      'email-templates',
      'invite'
  )

  const templatePath = path.join(
      emailAccountTemplatesPath,
      `magiclink-email-invite-${inviteType}.pug`
  )

  const compiledHTML = pug.compileFile(templatePath)({
    logo: config.client.logo,
    title: config.client.title,
    inviterUsername: inviterUsername,
    hashLink
  })
  const mailSender = config.email.from
  const email = {
    from: mailSender,
    to: toEmail,
    subject: config.email.subject.login,
    html: compiledHTML
  }

  return await sendEmail(app, email)
}

async function generateSMS (
    app: any,
    result: any,
    mobile: string,
    inviteType: string,
    inviterUsername
): Promise<void> {
  const hashLink = getInviteLink(inviteType, result.id, result.passcode)
  const appPath = path.dirname(require.main ? require.main.filename : '')
  const emailAccountTemplatesPath = path.join(
      appPath,
      '..',
      'server',
      'email-templates',
      'account'
  )
  const templatePath = path.join(
      emailAccountTemplatesPath,
      `magiclink-sms-invite-${inviteType}.pug`
  )
  const compiledHTML = pug.compileFile(templatePath)({
    title: config.client.title,
    inviterUsername: inviterUsername,
    hashLink
  }).replace(/&amp;/g, '&') // Text message links can't have HTML escaped ampersands.

  const sms = {
    mobile,
    text: compiledHTML
  }
  return await sendSms(app, sms)
}
