import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api'
import { getApiErrorMessage } from '@/api/axios'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { error_toast } from '@/utils/toastNotification'
import awaniShopLogo from '@/assets/main/AwaniShop.jpg'

export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      const { token, user } = await authApi.login(username.trim(), password)
      login(token, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      error_toast(getApiErrorMessage(err, t('auth.invalidCredentials')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <img
            src={awaniShopLogo}
            alt="Awani Shop"
            className="size-16 rounded-xl object-cover shadow-sm"
          />
          <h1 className="text-2xl font-semibold tracking-tight">Awani Shop</h1>
          <p className="text-muted-foreground text-sm">{t('auth.welcome')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
            <CardDescription className="text-sm">
              Entrez vos identifiants pour accéder au système.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.signin')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
