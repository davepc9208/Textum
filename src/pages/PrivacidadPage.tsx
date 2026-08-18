// src/pages/PrivacidadPage.tsx
// Política de privacidad — RGPD (UE/España) + buenas prácticas LATAM

import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';

const UPDATED = '16 de agosto de 2026';

export default function PrivacidadPage() {
  const { lang } = useLang();
  const isEs = lang !== 'en';

  useSEO({
    title: isEs
      ? 'Política de privacidad — TEXTUM'
      : 'Privacy Policy — TEXTUM',
    description: isEs
      ? 'Información sobre el tratamiento de datos personales, cookies y derechos de los usuarios de mentoriatextum.com.'
      : 'Information on personal data processing, cookies and user rights on mentoriatextum.com.',
    canonical: '/privacidad',
    ogType: 'website',
    lang: isEs ? 'es' : 'en',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-[0.2em] text-navy">
            TEXTUM
          </Link>
          <Link to="/" className="text-xs tracking-widest text-navy/50 hover:text-navy uppercase">
            {isEs ? 'Inicio' : 'Home'}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <p className="text-[11px] tracking-[0.3em] text-gold uppercase mb-3">
          {isEs ? 'Legal' : 'Legal'}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy mb-3">
          {isEs ? 'Política de privacidad' : 'Privacy policy'}
        </h1>
        <p className="text-sm text-navy/50 mb-10">
          {isEs ? `Última actualización: ${UPDATED}` : 'Last updated: 16 August 2026'}
        </p>

        <div className="prose-textum space-y-8 text-navy/80 text-[15px] leading-relaxed font-light">
          {isEs ? <ContentEs /> : <ContentEn />}
        </div>

        <div className="mt-14 pt-8 border-t border-navy/10 flex flex-wrap gap-4 text-xs tracking-widest uppercase">
          <Link to="/" className="text-navy/50 hover:text-gold transition-colors">
            ← {isEs ? 'Volver al inicio' : 'Back to home'}
          </Link>
          <Link to="/baja" className="text-navy/50 hover:text-gold transition-colors">
            {isEs ? 'Darse de baja de comunicaciones' : 'Unsubscribe from communications'}
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-navy mb-3 font-normal">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ContentEs() {
  return (
    <>
      <Section title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales recogidos a través del sitio web{' '}
          <strong className="font-medium text-navy">https://www.mentoriatextum.com</strong> (en adelante,
          el «Sitio») es:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            <strong className="font-medium text-navy">TEXTUM — Mentoría Académica Internacional</strong>
          </li>
          <li>
            Correo de contacto:{' '}
            <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
              contacto@mentoriatextum.com
            </a>
          </li>
          <li>
            WhatsApp / teléfono: +34 614 63 84 06
          </li>
          <li>
            Ámbito de actividad: mentoría académica para titulación, publicación científica y defensa
            oral, orientada a investigadores y estudiantes de posgrado en España, Latinoamérica y
            Europa.
          </li>
        </ul>
        <p>
          Las fundadoras académicas del proyecto son la Dra. Vilma María Pérez Viñas (ORCID
          0000-0003-3041-096X) y la Dra. Yadyra de la Caridad Piñera Concepción (ORCID
          0000-0002-8947-1364). La implementación técnica del Sitio es gestionada por el equipo
          TEXTUM.
        </p>
      </Section>

      <Section title="2. Ámbito de esta política">
        <p>
          Esta política describe cómo tratamos los datos personales de quienes visitan el Sitio,
          descargan recursos de las colecciones, solicitan diagnóstico o se comunican con nosotros.
          Se redacta conforme al <strong className="font-medium text-navy">Reglamento (UE) 2016/679
          (RGPD)</strong>, la <strong className="font-medium text-navy">Ley Orgánica 3/2018 (LOPDGDD)</strong>{' '}
          de España y principios equivalentes de transparencia y minimización aplicables en países
          de América Latina (por ejemplo, leyes de protección de datos de México, Colombia, Perú,
          Argentina, Chile, Ecuador, entre otros), sin perjuicio de las obligaciones locales que
          puedan corresponder al usuario en su jurisdicción.
        </p>
      </Section>

      <Section title="3. Datos que recogemos">
        <p><strong className="font-medium text-navy">3.1. Datos que usted nos facilita</strong></p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            <strong className="font-medium text-navy">Formulario de descarga de colecciones (lead magnet):</strong>{' '}
            nombre, correo electrónico, institución (opcional), país, rol académico, recurso
            solicitado e idioma. También registramos la aceptación de privacidad y, en su caso,
            el consentimiento para comunicaciones.
          </li>
          <li>
            <strong className="font-medium text-navy">Contacto / diagnóstico / WhatsApp:</strong>{' '}
            los datos que usted escriba al contactarnos (nombre, email, teléfono, contenido del
            mensaje).
          </li>
        </ul>
        <p className="mt-3"><strong className="font-medium text-navy">3.2. Datos técnicos y de uso</strong></p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            Datos de conexión y seguridad gestionados por la infraestructura de alojamiento
            (p. ej. Cloudflare): dirección IP, tipo de dispositivo, registros de acceso necesarios
            para seguridad y rendimiento.
          </li>
          <li>
            Si acepta cookies de analítica: datos de uso agregados o seudonimizados mediante
            Microsoft Clarity (páginas visitadas, interacciones, dispositivo), según su
            configuración de consentimiento.
          </li>
        </ul>
        <p>
          No solicitamos datos de categorías especiales (salud, ideología, etc.) ni datos de
          menores de 14 años de forma intencionada. Si es menor, no debe usar los formularios sin
          autorización de quien ejerza la patria potestad o tutela.
        </p>
      </Section>

      <Section title="4. Finalidades y base jurídica">
        <ul className="list-disc pl-5 space-y-2 text-navy/70">
          <li>
            <strong className="font-medium text-navy">Enviar el documento PDF solicitado</strong> y
            gestionar la descarga — <em>ejecución de medidas precontractuales / consentimiento</em>.
          </li>
          <li>
            <strong className="font-medium text-navy">Atender consultas y diagnósticos académicos</strong> —
            <em>interés legítimo y/o medidas precontractuales</em> a petición del interesado.
          </li>
          <li>
            <strong className="font-medium text-navy">Comunicaciones sobre servicios y contenidos TEXTUM</strong>{' '}
            (novedades, recursos, mentoría), solo cuando haya consentido o exista relación previa
            compatible — <em>consentimiento</em>; puede darse de baja en cualquier momento.
          </li>
          <li>
            <strong className="font-medium text-navy">Seguridad del Sitio y prevención de abuso</strong> —
            <em>interés legítimo</em>.
          </li>
          <li>
            <strong className="font-medium text-navy">Analítica web (Clarity)</strong>, solo si acepta
            cookies no esenciales — <em>consentimiento</em>.
          </li>
          <li>
            <strong className="font-medium text-navy">Cumplimiento de obligaciones legales</strong> cuando
            proceda.
          </li>
        </ul>
      </Section>

      <Section title="5. Conservación">
        <p>
          Conservamos los datos de leads y contacto mientras sean necesarios para las finalidades
          descritas, para responder a solicitudes o hasta que solicite la supresión o la baja de
          comunicaciones. Los registros técnicos de seguridad se conservan el tiempo mínimo
          razonable. Tras la baja de newsletter, mantenemos la marca de oposición el tiempo
          necesario para respetar su decisión y no reenviarle comunicaciones comerciales.
        </p>
      </Section>

      <Section title="6. Destinatarios y encargados del tratamiento">
        <p>Utilizamos proveedores que tratan datos por nuestra cuenta, con las garantías adecuadas:</p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            <strong className="font-medium text-navy">Supabase</strong> — base de datos y
            almacenamiento (leads, contenidos).
          </li>
          <li>
            <strong className="font-medium text-navy">Resend</strong> — envío de correos transaccionales
            (p. ej. enlace de descarga).
          </li>
          <li>
            <strong className="font-medium text-navy">Cloudflare</strong> — alojamiento, CDN y seguridad.
          </li>
          <li>
            <strong className="font-medium text-navy">Microsoft Clarity</strong> — analítica, solo con
            su consentimiento de cookies.
          </li>
        </ul>
        <p>
          Algunos proveedores pueden estar situados fuera del Espacio Económico Europeo. En esos
          casos nos apoyamos en cláusulas contractuales tipo u otras garantías reconocidas por el
          RGPD cuando corresponda. <strong className="font-medium text-navy">No vendemos</strong> sus
          datos personales ni los cedemos a terceros para su marketing independiente.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Usamos cookies y tecnologías similares:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            <strong className="font-medium text-navy">Esenciales / técnicas:</strong> necesarias para
            el funcionamiento del Sitio (p. ej. preferencia de idioma en el dispositivo, seguridad).
          </li>
          <li>
            <strong className="font-medium text-navy">Analítica (Microsoft Clarity):</strong> solo se
            activan si pulsa «Aceptar» en el banner de cookies. Puede elegir «Solo esenciales» y
            navegar sin analítica de terceros.
          </li>
        </ul>
        <p>
          Puede cambiar de opinión borrando el almacenamiento local del navegador para este sitio
          o contactándonos. El banner guarda su elección en el navegador
          (<code className="text-xs bg-navy/5 px-1 rounded">textum_cookie_consent</code>).
        </p>
      </Section>

      <Section title="8. Sus derechos">
        <p>Conforme al RGPD y, en su caso, a la legislación de su país, puede ejercer:</p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>Acceso, rectificación y supresión</li>
          <li>Limitación y oposición al tratamiento</li>
          <li>Portabilidad, cuando proceda</li>
          <li>Retirada del consentimiento en cualquier momento (sin afectar al tratamiento previo)</li>
          <li>
            Baja de comunicaciones comerciales mediante el enlace del correo o la página{' '}
            <Link to="/baja" className="text-gold underline underline-offset-2">
              /baja
            </Link>
          </li>
        </ul>
        <p>
          Para ejercer derechos, escriba a{' '}
          <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
            contacto@mentoriatextum.com
          </a>{' '}
          indicando su solicitud y un medio de contacto. Responderemos en los plazos legales.
        </p>
        <p>
          Si considera que el tratamiento no se ajusta a la normativa, puede reclamar ante la{' '}
          <strong className="font-medium text-navy">Agencia Española de Protección de Datos (AEPD)</strong>{' '}
          (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
            www.aepd.es
          </a>
          , o ante la autoridad de protección de datos de su país de residencia en Latinoamérica u
          otra jurisdicción aplicable.
        </p>
      </Section>

      <Section title="9. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables (HTTPS, control de acceso al
          panel de administración, claves de servicio solo en el servidor, enlaces de descarga
          temporales firmados). Ningún sistema es 100 % invulnerable; le pedimos que nos avise si
          detecta un incidente relacionado con sus datos.
        </p>
      </Section>

      <Section title="10. Enlaces a terceros">
        <p>
          El Sitio puede contener enlaces a redes sociales u otros sitios. No somos responsables de
          sus políticas de privacidad. Le recomendamos leerlas antes de facilitar datos en esos
          entornos.
        </p>
      </Section>

      <Section title="11. Cambios">
        <p>
          Podemos actualizar esta política para reflejar cambios legales o del servicio. La fecha
          de «última actualización» indica la versión vigente. El uso continuado del Sitio tras
          cambios relevantes implica el conocimiento de la nueva versión; cuando el cambio exija
          un nuevo consentimiento, se lo solicitaremos de forma clara.
        </p>
      </Section>

      <Section title="12. Contacto">
        <p>
          Para cualquier cuestión sobre privacidad o datos personales:{' '}
          <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
            contacto@mentoriatextum.com
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <Section title="1. Data controller">
        <p>
          The controller of personal data collected through{' '}
          <strong className="font-medium text-navy">https://www.mentoriatextum.com</strong> (the “Site”) is:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>
            <strong className="font-medium text-navy">TEXTUM — International Academic Mentoring</strong>
          </li>
          <li>
            Email:{' '}
            <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
              contacto@mentoriatextum.com
            </a>
          </li>
          <li>WhatsApp / phone: +34 614 63 84 06</li>
          <li>
            Activity: academic mentoring for degree projects, scientific publication and oral
            defence, serving researchers and postgraduate students in Spain, Latin America and Europe.
          </li>
        </ul>
      </Section>

      <Section title="2. Scope">
        <p>
          This policy explains how we process personal data of visitors, users who download
          collection resources, and people who contact us. It is drafted in line with the EU GDPR,
          Spain’s LOPDGDD, and transparency principles consistent with data-protection laws in many
          Latin American jurisdictions, without prejudice to local rules that may apply to you.
        </p>
      </Section>

      <Section title="3. Data we collect">
        <p>
          <strong className="font-medium text-navy">Data you provide:</strong> name, email,
          institution (optional), country, academic role, requested resource and language on
          download forms; and any information you send when contacting us.
        </p>
        <p>
          <strong className="font-medium text-navy">Technical data:</strong> security and access logs
          via our hosting stack (e.g. Cloudflare). Analytics via Microsoft Clarity only if you
          accept non-essential cookies.
        </p>
      </Section>

      <Section title="4. Purposes and legal bases">
        <ul className="list-disc pl-5 space-y-1 text-navy/70">
          <li>Deliver requested PDFs — consent / pre-contractual steps</li>
          <li>Respond to enquiries and academic diagnosis requests</li>
          <li>Service-related communications where consented — you may unsubscribe anytime</li>
          <li>Site security — legitimate interests</li>
          <li>Analytics (Clarity) — consent only</li>
        </ul>
      </Section>

      <Section title="5. Retention">
        <p>
          We keep lead and contact data as long as needed for the stated purposes, to handle
          requests, or until you ask for erasure or unsubscribe. We do not sell personal data.
        </p>
      </Section>

      <Section title="6. Processors">
        <p>
          Supabase (database/storage), Resend (email), Cloudflare (hosting/security), and Microsoft
          Clarity (analytics with consent). Appropriate safeguards apply to international transfers
          where required.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Essential cookies for the Site to work; analytics cookies only if you click “Accept” on
          the banner. You may choose essential-only browsing.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Access, rectification, erasure, restriction, objection, portability where applicable, and
          withdrawal of consent. Unsubscribe via the email link or{' '}
          <Link to="/baja" className="text-gold underline underline-offset-2">
            /baja
          </Link>
          . Contact{' '}
          <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
            contacto@mentoriatextum.com
          </a>
          . You may also lodge a complaint with the Spanish AEPD (
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
            aepd.es
          </a>
          ) or your local authority.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Privacy questions:{' '}
          <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline underline-offset-2">
            contacto@mentoriatextum.com
          </a>
        </p>
      </Section>
    </>
  );
}
