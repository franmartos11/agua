import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <Logo className="h-12 w-12" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">Página no encontrada</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El link que seguiste no existe o ya no está disponible.
          </p>
        </div>
        <Link href="/">
          <Button size="sm">Volver al inicio</Button>
        </Link>
      </div>
    </main>
  );
}
