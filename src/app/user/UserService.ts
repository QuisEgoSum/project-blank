import {BaseService} from 'core/service'
import type {IUser} from './UserModel'
import type {UserRepository} from './UserRepository'
import {service as sessionService} from './packages/session'
import {IncorrectUserCredentials, UserAuthorizationError} from './user-error'
import bcrypt from 'bcrypt'
import {Types} from 'mongoose'
import {config} from '@config'
import {AuthorizedUser, UserRole} from './index'
import {UserCredentials} from './schemas'


export class UserService extends BaseService<IUser, UserRepository> {

  private static superadminId = '4920737570657261646d696e'

  private static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  private static compareHashPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  constructor(userRepository: UserRepository) {
    super(userRepository)
  }

  async authorization(sessionId?: string): Promise<AuthorizedUser> {
    if (!sessionId) {
      throw new UserAuthorizationError()
    }

    const session = await sessionService.findSessionById(sessionId)

    if (session === null) {
      throw new UserAuthorizationError()
    }

    return {
      sessionId: session._id,
      userId: session.user._id,
      userRole: session.user.role
    }
  }

  async signin(credentials: UserCredentials): Promise<{user: IUser, sessionId: string}> {
    const user = await this.repository.findByLogin(credentials.login)

    if (!user) {
      throw new IncorrectUserCredentials()
    }

    if (!await UserService.compareHashPassword(credentials.password, user.passwordHash)) {
      throw new IncorrectUserCredentials()
    }

    const session = await sessionService.createForUser(user._id)

    return {
      user: user,
      sessionId: session._id
    }
  }

  async upsertSuperadmin() {
    const superadmin = {
      username: config.user.superadmin.username,
      email: config.user.superadmin.email,
      role: UserRole.ADMIN,
      passwordHash: await UserService.hashPassword(config.user.superadmin.password)
    }

    await this.repository.updateById(
      new Types.ObjectId(UserService.superadminId),
      superadmin,
      {upsert: true}
    )
  }
}