"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, User, Shield, Briefcase } from "lucide-react";

import { AuthProvider } from "@/lib/auth/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { seedIfEmpty } from "@/lib/seed";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEMO_ACCOUNTS = [
  {
    label: "Zaloguj jako Alicja (Admin)",
    email: "alicja@gmail.com",
    password: "admin123",
    icon: Shield,
    variant: "default" as const,
  },
  {
    label: "Zaloguj jako Mateusz (Manager)",
    email: "mateusz@gmail.com",
    password: "manager123",
    icon: Briefcase,
    variant: "secondary" as const,
  },
  {
    label: "Zaloguj jako Julia (Pracownik)",
    email: "julia@gmail.com",
    password: "employee123",
    icon: User,
    variant: "outline" as const,
  },
];

function LoginForm() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/tracker");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "register") {
        await register({ name, email, password });
        toast.success("Konto utworzone");
      } else {
        await login({ email, password });
      }
      router.push("/tracker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystapil blad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);
    try {
      await seedIfEmpty();
      await login({ email: demoEmail, password: demoPassword });
      router.push("/tracker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystapil blad");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold">Pirxey Time</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manualne logowanie czasu pracy
          </p>
        </div>

        {/* Login/Register card */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === "login" ? "Logowanie" : "Rejestracja"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Zaloguj sie na swoje konto"
                : "Utworz nowe konto"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Imie i nazwisko</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Adres e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@firma.pl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Haslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wpisz haslo"
                  required
                  minLength={mode === "register" ? 6 : 1}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Przetwarzanie..."
                  : mode === "login"
                    ? "Zaloguj sie"
                    : "Zarejestruj sie"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Nie masz konta?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("register")}
                  >
                    Zarejestruj sie
                  </button>
                </>
              ) : (
                <>
                  Masz juz konto?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Zaloguj sie
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Konta demonstracyjne</CardTitle>
            <CardDescription className="text-xs">
              Szybkie logowanie na konto testowe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((demo) => {
              const Icon = demo.icon;
              return (
                <Button
                  key={demo.email}
                  variant={demo.variant}
                  className="w-full justify-start gap-2"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                >
                  <Icon className="h-4 w-4" />
                  {demo.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
