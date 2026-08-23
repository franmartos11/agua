import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* Fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--primary-soft) 0%, transparent 70%)",
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 text-primary/5 -z-10"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5c3 4.2 7 8.6 7 12.7a7 7 0 1 1-14 0c0-4.1 4-8.5 7-12.7Z" />
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 text-primary/5 -z-10"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5c3 4.2 7 8.6 7 12.7a7 7 0 1 1-14 0c0-4.1 4-8.5 7-12.7Z" />
      </svg>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-14 w-14 shadow-md shadow-primary/20" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Consorcio · Agua
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá con tu email y contraseña
          </p>
        </div>
        <Card className="shadow-lg shadow-black/[0.03]">
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
