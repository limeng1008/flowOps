import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { getDataSource } from '../../../DataSource'
import { FlowOpsAuthError, FlowOpsAuthService } from './service'

let configured = false

export const configureSelfLocalStrategy = () => {
    if (configured) return passport

    passport.use(
        'flowops-local',
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
                session: false
            },
            async (email, password, done) => {
                try {
                    const loggedInUser = await new FlowOpsAuthService(getDataSource()).login({ email, password })
                    done(null, loggedInUser as any)
                } catch (error) {
                    if (error instanceof FlowOpsAuthError) return done(null, false, { message: error.message })
                    done(error)
                }
            }
        )
    )
    configured = true
    return passport
}
