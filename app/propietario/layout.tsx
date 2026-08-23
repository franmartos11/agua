import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/logo";
import { NavTabs } from "@/components/ui/nav-tabs";

export default async function PropietarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: perfil }, { count: pendientesCount }] = await Promise.all([
    supabase.from("perfil").select("rol, nombre").eq("id", user.id).single(),
    supabase
      .from("factura")
      .select("id", { count: "exact", head: true })
      .in("estado", ["pendiente", "parcial", "vencida"]),
  ]);

  if (perfil?.rol === "admin") redirect("/admin");

  const NAV_LINKS = [
    { href: "/propietario", label: "Inicio" },
    { href: "/propietario/facturas", label: "Facturas", badge: pendientesCount ?? 0 },
  ];

  return (
    <div className="min-h-screen">
      <header className="print:hidden flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {perfil?.nombre}
            </p>
            <p className="text-xs text-muted-foreground">Mi cuenta</p>
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
      <main className="mx-auto max-w-3xl p-4 sm:p-6 print:p-0 print:max-w-none">{children}</main>
    </div>
  );
}
