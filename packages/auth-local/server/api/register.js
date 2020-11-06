import Provider from '../Provider'
import bcrypt from 'bcrypt'
import { EMAIL_REGEXP } from '../../isomorphic'

export default function (req, res) {
  parseRegisterRequest(req, res, function (err) {
    if (err) return res.status(403).json({ message: err })

    register(req, function (err, userId) {
      if (err) return res.status(403).json({ message: err })
      return res.json(userId)
    })
  })
}

async function register (req, done) {
  const { model } = req
  const email = req.body.email.toLowerCase()
  const password = req.body.password

  // You can pass custom values to new user with help of userData parameter
  // For example we can pass userId from session
  const userData = req.body.userData || {}

  try {
    const profile = { email: email.toLowerCase(), ...userData }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    profile.hash = hash
    profile.salt = salt

    const provider = new Provider(model, profile)
    const authData = await provider.loadAuthData()
    if (authData) return done('[@startup/auth-local] Error: User already exists')

    const userId = await provider.findOrCreateUser()
    done(null, userId)
  } catch (err) {
    done(err)
  }
}

function parseRegisterRequest (req, res, done) {
  const email = (req.body.email || '').toLowerCase()
  const password = req.body.password
  const confirm = req.body.confirm
  if (!email) return done('[@startup/auth-local] Please fill email')
  if (!password) return done('[@startup/auth-local] Please fill password')
  if (!confirm) return done('[@startup/auth-local] Please fill password confirmation')
  if (password !== confirm) return done('[@startup/auth-local] Password should match confirmation')
  if (password.length < 8) return done('[@startup/auth-local] Password length should be at least 8')
  if (!EMAIL_REGEXP.test(email)) return done('[@startup/auth-local] Incorrect email')

  done(null)
}
