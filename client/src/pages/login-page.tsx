import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useAnimation } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { error_toast } from '@/utils/toastNotification'
import awaniShopLogo from '@/assets/main/AwaniShop.jpg'

const ease = [0.22, 1, 0.36, 1] as const

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export function LoginPage() {
  const { t, locale, setLocale } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(0)
  const shakeControls = useAnimation()

  useEffect(() => {
    if (!shake) return
    void shakeControls.start({
      x: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.45 },
    })
  }, [shake, shakeControls])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      const { token, user } = await authApi.login(username.trim(), password)
      login(token, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setShake((value) => value + 1)
      error_toast(getApiErrorMessage(err, t('auth.invalidCredentials')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-background relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-10">
        <motion.div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -top-28 -left-24 size-80 rounded-full blur-3xl"
          animate={{ x: [0, 36, 0], y: [0, 24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="bg-primary/10 pointer-events-none absolute -right-20 bottom-0 size-96 rounded-full blur-3xl"
          animate={{ x: [0, -28, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute top-6 right-6 flex gap-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {(['fr', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium',
                locale === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {code.toUpperCase()}
            </button>
          ))}
          <ThemeToggle />
        </motion.div>

        <motion.div
          className="relative z-10 grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
        >
          <motion.div variants={rise} className="flex flex-col items-center text-center md:items-start md:text-left">
            <motion.img
              src={awaniShopLogo}
              alt="Awani Shop"
              className="size-20 rounded-2xl object-cover shadow-sm"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            />
            <h1 className="text-foreground !m-0 !mt-6 !text-4xl !font-semibold !tracking-tight md:!text-5xl">
              Awani Shop
            </h1>
            <p className="text-muted-foreground mt-3 max-w-sm text-sm md:text-base">{t('auth.welcome')}</p>
          </motion.div>

          <motion.div variants={rise} className="bg-card ring-foreground/10 w-full rounded-3xl shadow-sm ring-1">
            <motion.div animate={shakeControls} className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h2 className="text-foreground !m-0 !text-xl !font-semibold">{t('auth.login')}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t('auth.subtitle')}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:opacity-50"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? 'hide' : 'show'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </div>
              <motion.div whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={loading ? 'loading' : 'idle'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      {loading ? t('common.loading') : t('auth.signin')}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  )
}
