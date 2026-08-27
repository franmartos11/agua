/** Normaliza un número de teléfono argentino para wa.me.
 *  - Elimina espacios, guiones y paréntesis.
 *  - Si no empieza con código de país, agrega 549 (ARG + 9 para móvil).
 */
export function waLink(telefono: string): string {
  const digits = telefono.replace(/\D/g, "");
  // Ya tiene código de país (54...)
  if (digits.startsWith("54")) return `https://wa.me/${digits}`;
  // Agrega 549 (Argentina, móvil)
  return `https://wa.me/549${digits}`;
}

type Props = {
  email?: string | null;
  telefono?: string | null;
};

export function ContactButtons({ email, telefono }: Props) {
  if (!email && !telefono) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      {telefono && (
        <a
          href={waLink(telefono)}
          target="_blank"
          rel="noopener noreferrer"
          title={`WhatsApp: ${telefono}`}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-[#25D366] transition-colors hover:bg-[#25D366]/10"
        >
          {/* WhatsApp icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.845L.057 23.486a.5.5 0 0 0 .612.612l5.703-1.479A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75A9.75 9.75 0 0 1 2.25 12 9.75 9.75 0 0 1 12 2.25 9.75 9.75 0 0 1 21.75 12 9.75 9.75 0 0 1 12 21.75z" />
          </svg>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          title={`Email: ${email}`}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {/* Mail icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </a>
      )}
    </span>
  );
}
