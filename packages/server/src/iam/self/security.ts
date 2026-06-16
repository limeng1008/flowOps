import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

type PasswordRule = {
    message: string
    isValid: (password: string) => boolean
}

const passwordRules: PasswordRule[] = [
    {
        message: 'Password must be at least 8 characters',
        isValid: (password) => password.length >= 8
    },
    {
        message: 'Password must not be more than 128 characters',
        isValid: (password) => password.length <= 128
    },
    {
        message: 'Password must contain at least one lowercase letter',
        isValid: (password) => /[a-z]/.test(password)
    },
    {
        message: 'Password must contain at least one uppercase letter',
        isValid: (password) => /[A-Z]/.test(password)
    },
    {
        message: 'Password must contain at least one digit',
        isValid: (password) => /\d/.test(password)
    },
    {
        message: 'Password must contain at least one special character',
        isValid: (password) => /[^a-zA-Z0-9]/.test(password)
    }
]

export const getHash = (value: string): string => bcrypt.hashSync(value, BCRYPT_ROUNDS)

export const validatePasswordOrThrow = (password: string): void => {
    for (const rule of passwordRules) {
        if (!rule.isValid(password)) throw new Error(rule.message)
    }
}
