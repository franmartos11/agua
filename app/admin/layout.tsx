import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { NavTabs } from "@/components/ui/nav-tabs";

const NAV_LINKS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/plano", label: "Plano" },
  { href: "/admin/propietarios", label: "Propietarios" },
  { href: "/admin/lotes", label: "Lotes" },
  { href: "/admin/lecturas", label: "Lecturas" },
  { href: "/admin/tarifas", label: "Tarifas" },
  { href: "/admin/periodos", label: "Períodos" },
  { href: "/admin/pagos", label: "Cobranzas" },
  { href: "/admin/reportes", label: "Reportes" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfil")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") redirect("/propietario");

  return (
    <div className="min-h-screen">
      <header className="print:hidden flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {perfil.nombre}
            </p>
            <Badge variant="info">Administración</Badge>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <NavTabs links={NAV_LINKS} />
      <main className="mx-auto max-w-5xl p-4 sm:p-6 print:p-0 print:max-w-none">{children}</main>
    </div>
  );
}
