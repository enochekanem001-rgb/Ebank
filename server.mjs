import { createServer } from 'node:http'
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { sendVerificationEmail } from './email.mjs'
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server'

const database = new DatabaseSync('./northstar.db')
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verification_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    auth_level TEXT NOT NULL DEFAULT 'email'
  );
  CREATE TABLE IF NOT EXISTS passkeys (
    credential_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    public_key BLOB NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    transports TEXT
  );
  CREATE TABLE IF NOT EXISTS transfer_approvals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    recipient_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    status TEXT NOT NULL,
    provider_reference TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

try {
  database.exec('ALTER TABLE users ADD COLUMN display_name TEXT')
} catch (error) {
  if (!error.message.includes('duplicate column name')) throw error
}
try {
  database.exec('ALTER TABLE users ADD COLUMN password_hash TEXT')
} catch (error) {
  if (!error.message.includes('duplicate column name')) throw error
}
try {
  database.exec("ALTER TABLE sessions ADD COLUMN auth_level TEXT NOT NULL DEFAULT 'email'")
} catch (error) {
  if (!error.message.includes('duplicate column name')) throw error
}

const json = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.WEB_ORIGIN || 'http://localhost:5173', 'Access-Control-Allow-Credentials': 'true' })
  response.end(JSON.stringify(body))
}

const body = async (request) => {
  let data = ''
  for await (const chunk of request) data += chunk
  return JSON.parse(data || '{}')
}

const validEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const rpName = 'Northstar Banking'
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost'
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173'
const hashToken = (token) => scryptSync(token, process.env.SESSION_SECRET || 'northstar-development-secret', 32).toString('hex')
const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
const verifyPassword = (password, stored) => {
  if (!stored || typeof password !== 'string') return false
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'))
}
const validPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 128
const cookieToken = (request) => request.headers.cookie?.match(/northstar_session=([^;]+)/)?.[1]
const sessionUser = (request) => {
  const token = cookieToken(request)
  if (!token) return null
  const session = database.prepare('SELECT user_id, auth_level FROM sessions WHERE token_hash = ? AND expires_at > ?').get(hashToken(token), Date.now())
  if (!session) return null
  return { ...database.prepare('SELECT id, email, username, display_name, password_hash FROM users WHERE id = ?').get(session.user_id), authLevel: session.auth_level }
}
const createSession = (userId) => {
  const token = randomBytes(32).toString('base64url')
  database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), userId, Date.now() + 7 * 24 * 60 * 60 * 1000)
  return token
}
const setSession = (response, token) => response.setHeader('Set-Cookie', `northstar_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`)
const upgradeSession = (request) => {
  const token = cookieToken(request)
  if (token) database.prepare("UPDATE sessions SET auth_level = 'strong' WHERE token_hash = ?").run(hashToken(token))
}
const authRequired = (request, response) => {
  const user = sessionUser(request)
  if (!user) {
    json(response, 401, { error: 'Sign in again before continuing' })
    return null
  }
  return user
}
const webauthnChallenges = new Map()

class ProviderError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

const paystackRequest = async (path, options = {}) => {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY.includes('replace_with')) {
    throw new ProviderError('Bank transfers are not configured. Add a live or test PAYSTACK_SECRET_KEY to .env and restart the API.', 503)
  }
  let response
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
  } catch {
    throw new ProviderError('Paystack could not be reached. Check the API network connection and try again.', 502)
  }
  let data = {}
  try {
    data = await response.json()
  } catch {
    throw new ProviderError(`Paystack returned an invalid response (HTTP ${response.status}).`, 502)
  }
  if (!response.ok || !data.status) throw new ProviderError(data.message || 'Paystack rejected the request', response.status >= 400 && response.status < 500 ? 400 : 502)
  return data.data
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' })
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && request.url === '/api/banks') {
      const banks = await paystackRequest('/bank?country=nigeria&currency=NGN&perPage=100')
      return json(response, 200, { banks: banks.map(({ name, code }) => ({ name, code })) })
    }
    if (request.method === 'GET' && request.url.startsWith('/api/banks/resolve?')) {
      const query = new URL(request.url, 'http://localhost').searchParams
      const accountNumber = query.get('account_number') || ''
      const bankCode = query.get('bank_code') || ''
      if (!/^\d{10}$/.test(accountNumber) || !/^\d+$/.test(bankCode)) return json(response, 400, { error: 'Enter a valid 10-digit account number and choose a bank' })
      const account = await paystackRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`)
      return json(response, 200, { accountName: account.account_name, accountNumber: account.account_number })
    }
    if (request.method !== 'POST') return json(response, 404, { error: 'Not found' })
    const data = await body(request)

    if (request.url === '/api/auth/request-code') {
      const email = String(data.email || '').trim().toLowerCase()
      if (!validEmail(email)) return json(response, 400, { error: 'Enter a valid email address' })
      const code = String(randomInt(100000, 1000000))
      database.prepare('INSERT OR REPLACE INTO verification_codes (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)').run(email, code, Date.now() + 10 * 60 * 1000)
      try {
        await sendVerificationEmail(email, code)
      } catch (error) {
        database.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)
        console.error(`[Northstar] Could not send verification email: ${error.message}`)
        return json(response, 503, { error: error.message })
      }
      return json(response, 200, { message: 'Verification code sent to your email' })
    }

    if (request.url === '/api/auth/verify-code') {
      const email = String(data.email || '').trim().toLowerCase()
      const code = String(data.code || '').trim()
      const record = database.prepare('SELECT code, expires_at, attempts FROM verification_codes WHERE email = ?').get(email)
      if (!record || record.expires_at < Date.now() || record.attempts >= 5 || record.code !== code) {
        if (record) database.prepare('UPDATE verification_codes SET attempts = attempts + 1 WHERE email = ?').run(email)
        return json(response, 401, { error: 'The verification code is incorrect or expired' })
      }
      database.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)
      let user = database.prepare('SELECT id, email, username, display_name FROM users WHERE email = ?').get(email)
      if (!user) {
        const id = randomUUID()
        database.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').run(id, email, new Date().toISOString())
        user = { id, email, username: null, display_name: null }
      }
      setSession(response, createSession(user.id))
      return json(response, 200, { user, verified: true, needsPassword: !user.password_hash })
    }

    if (request.url === '/api/auth/password') {
      const user = authRequired(request, response)
      if (!user) return
      const password = String(data.password || '')
      if (!validPassword(password)) return json(response, 400, { error: 'Password must be 8-128 characters' })
      if (user.password_hash && !verifyPassword(password, user.password_hash)) return json(response, 401, { error: 'Incorrect password' })
      if (!user.password_hash) database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id)
      upgradeSession(request)
      return json(response, 200, { authenticated: true })
    }

    if (request.url === '/api/auth/passkey/register/options') {
      const user = authRequired(request, response)
      if (!user) return
      const existing = database.prepare('SELECT credential_id FROM passkeys WHERE user_id = ?').all(user.id).map((key) => ({ id: key.credential_id }))
      const options = await generateRegistrationOptions({ rpName, rpID, userID: user.id, userName: user.email, userDisplayName: user.display_name || user.email, attestationType: 'none', excludeCredentials: existing })
      webauthnChallenges.set(user.id, options.challenge)
      return json(response, 200, options)
    }

    if (request.url === '/api/auth/passkey/register/verify') {
      const user = authRequired(request, response)
      if (!user) return
      const challenge = webauthnChallenges.get(user.id)
      if (!challenge) return json(response, 400, { error: 'Passkey registration expired. Start again.' })
      const verification = await verifyRegistrationResponse({ response: data.response, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID })
      webauthnChallenges.delete(user.id)
      if (!verification.verified || !verification.registrationInfo) return json(response, 400, { error: 'Face ID registration was not verified' })
      const { credential } = verification.registrationInfo
      database.prepare('INSERT OR REPLACE INTO passkeys (credential_id, user_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)').run(credential.id, user.id, Buffer.from(credential.publicKey), credential.counter, JSON.stringify(data.response.response?.transports || []))
      return json(response, 200, { registered: true })
    }

    if (request.url === '/api/auth/passkey/login/options') {
      const email = String(data.email || '').trim().toLowerCase()
      const user = database.prepare('SELECT id FROM users WHERE email = ?').get(email)
      if (!user) return json(response, 401, { error: 'No account exists for that email' })
      const credentials = database.prepare('SELECT credential_id, transports FROM passkeys WHERE user_id = ?').all(user.id).map((key) => ({ id: key.credential_id, transports: JSON.parse(key.transports || '[]') }))
      if (!credentials.length) return json(response, 400, { error: 'Set up Face ID from Account settings first' })
      const options = await generateAuthenticationOptions({ rpID, allowCredentials: credentials, userVerification: 'required' })
      webauthnChallenges.set(`login:${email}`, options.challenge)
      return json(response, 200, options)
    }

    if (request.url === '/api/auth/passkey/login/verify') {
      const email = String(data.email || '').trim().toLowerCase()
      const user = database.prepare('SELECT id, email, username, display_name, password_hash FROM users WHERE email = ?').get(email)
      const challenge = webauthnChallenges.get(`login:${email}`)
      const credential = database.prepare('SELECT credential_id, public_key, counter, user_id FROM passkeys WHERE credential_id = ? AND user_id = ?').get(data.response?.id, user?.id)
      if (!user || !challenge || !credential) return json(response, 401, { error: 'Face ID sign-in expired or is not registered' })
      const verification = await verifyAuthenticationResponse({ response: data.response, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID, credential: { id: credential.credential_id, publicKey: new Uint8Array(credential.public_key), counter: credential.counter } })
      webauthnChallenges.delete(`login:${email}`)
      if (!verification.verified) return json(response, 401, { error: 'Face ID could not verify you' })
      database.prepare('UPDATE passkeys SET counter = ? WHERE credential_id = ?').run(verification.authenticationInfo.newCounter, credential.credential_id)
      const token = createSession(user.id)
      setSession(response, token)
      upgradeSession({ headers: { cookie: `northstar_session=${token}` } })
      return json(response, 200, { user, authenticated: true })
    }
    }

    if (request.url === '/api/users/username') {
      const email = String(data.email || '').trim().toLowerCase()
      const username = String(data.username || '').trim().toLowerCase()
      if (!validEmail(email) || !/^[a-z0-9_]{3,20}$/.test(username)) return json(response, 400, { error: 'Username must be 3-20 letters, numbers, or underscores' })
      const user = database.prepare('SELECT id FROM users WHERE email = ?').get(email)
      if (!user) return json(response, 403, { error: 'Verify your email before choosing a username' })
      try {
        database.prepare('UPDATE users SET username = ? WHERE email = ?').run(username, email)
      } catch {
        return json(response, 409, { error: 'That username is already taken' })
      }
      return json(response, 200, { username })
    }

    if (request.url === '/api/users/profile') {
      const email = String(data.email || '').trim().toLowerCase()
      const displayName = String(data.displayName || '').trim()
      if (!validEmail(email) || displayName.length < 3 || displayName.length > 10) return json(response, 400, { error: 'Name must be 3-10 characters' })
      const user = database.prepare('SELECT id FROM users WHERE email = ?').get(email)
      if (!user) return json(response, 403, { error: 'Verify your email before updating your profile' })
      database.prepare('UPDATE users SET display_name = ? WHERE email = ?').run(displayName, email)
      return json(response, 200, { displayName })
    }

    if (request.url === '/api/transfers') {
      const user = authRequired(request, response)
      if (!user) return
      if (user.authLevel !== 'strong') return json(response, 403, { error: 'Complete password or Face ID authentication before sending money' })
      const name = String(data.name || '').trim()
      const accountNumber = String(data.accountNumber || '').trim()
      const bankCode = String(data.bankCode || '').trim()
      const amount = Number(data.amount)
      if (name.length < 2 || !/^\d{10}$/.test(accountNumber) || !/^\d+$/.test(bankCode) || !Number.isInteger(amount) || amount < 100) {
        return json(response, 400, { error: 'Enter a verified recipient, valid 10-digit account number, bank, and amount of at least ₦1' })
      }
      const approvalId = randomUUID()
      const now = new Date().toISOString()
      database.prepare('INSERT INTO transfer_approvals (id, user_id, amount, recipient_name, account_number, bank_code, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(approvalId, user.id, amount, name, accountNumber, bankCode, 'processing', now, now)
      let transfer
      try {
        const recipient = await paystackRequest('/transferrecipient', {
          method: 'POST',
          body: JSON.stringify({ type: 'nuban', name, account_number: accountNumber, bank_code: bankCode, currency: 'NGN' }),
        })
        transfer = await paystackRequest('/transfer', {
          method: 'POST',
          body: JSON.stringify({ source: 'balance', amount, recipient: recipient.recipient_code, reason: `Northstar transfer to ${name}`, reference: `northstar_${approvalId}` }),
        })
      } catch (error) {
        database.prepare('UPDATE transfer_approvals SET status = ?, updated_at = ? WHERE id = ?').run('failed', new Date().toISOString(), approvalId)
        throw error
      }
      database.prepare('UPDATE transfer_approvals SET status = ?, provider_reference = ?, updated_at = ? WHERE id = ?').run(transfer.status || 'submitted', transfer.reference, new Date().toISOString(), approvalId)
      return json(response, 200, { id: approvalId, reference: transfer.reference, status: transfer.status, recipient: name })
    }

    return json(response, 404, { error: 'Not found' })
  } catch (error) {
    console.error(error)
    return json(response, error.status || 500, { error: error.message || 'The server could not complete that request' })
  }
})

const port = Number(process.env.PORT || 8787)
server.listen(port, () => console.log(`Northstar API listening on http://localhost:${port}`))
