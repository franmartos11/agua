import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { SetPasswordForm } from "./set-password-form";

export default function ActualizarPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-12 w-12" />
          <h1 className="mt-4 text-lg font-semibold text-foreground">Creá tu contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta va a ser tu contraseña para entrar al panel de propietarios.
          </p>
        </div>
        <Card>
          <SetPasswordForm />
        </Card>
      </div>
    </main>
  );
}
