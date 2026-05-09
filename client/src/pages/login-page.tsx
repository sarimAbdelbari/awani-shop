import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Awanishop</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your account to continue.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use your email and password. Auth will be wired later.
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard">Skip to dashboard</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
