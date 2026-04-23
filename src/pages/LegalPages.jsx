import React from 'react';
import { Link } from 'react-router-dom';

const LegalLayout = ({ title, children }) => (
    <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ marginBottom: '40px' }}>
                <Link to="/" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    ← Volver al inicio
                </Link>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--color-text)', marginBottom: '8px' }}>
                {title}
            </h1>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '48px', fontSize: '0.9rem' }}>
                Última actualización: marzo de 2026
            </p>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '16px',
                padding: 'clamp(24px, 4vw, 48px)',
                boxShadow: 'var(--shadow-sm)',
                lineHeight: '1.8',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
            }}>
                {children}
            </div>
            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    · <Link to="/aviso-legal" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Aviso Legal</Link>
                    {' · '}
                    <Link to="/politica-privacidad" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Política de Privacidad</Link>
                    {' · '}
                    <Link to="/politica-cookies" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Política de Cookies</Link>
                    {' · '}
                    <Link to="/condiciones-compra" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Condiciones de Compra</Link>
                    {' ·'}
                </p>
            </div>
        </div>
    </div>
);

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-text)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid var(--color-primary-light)' }}>
            {title}
        </h2>
        {children}
    </div>
);

// ─── AVISO LEGAL ──────────────────────────────────────────────────────────────
export const AvisoLegal = () => (
    <LegalLayout title="Aviso Legal">
        <Section title="1. Datos identificativos del titular">
            <p>En cumplimiento del artículo 10 de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</strong>, se informa de los datos del titular de este sitio web:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Titular:</strong> María Concepción Ortega Yago</li>
                <li><strong>NIF:</strong> 29074067C</li>
                <li><strong>Domicilio:</strong> C. San Antonio, 5, bajo, 30510 Yecla, Murcia</li>
                <li><strong>Teléfono:</strong> 605 88 99 38</li>
                <li><strong>Email de contacto:</strong> <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)' }}>hola@merakiartesano.es</a></li>
                <li><strong>Nombre comercial:</strong> Meraki ArteSano</li>
                <li><strong>Web:</strong> merakiartesano.es</li>
            </ul>
        </Section>

        <Section title="2. Objeto y condiciones de uso">
            <p>El presente Aviso Legal regula el uso del sitio web <strong>merakiartesano.es</strong>, cuyo acceso y uso es de carácter libre y gratuito para los usuarios. No obstante, la utilización de determinados servicios (compra de productos, suscripción al club) puede estar condicionada a la previa aceptación de las condiciones específicas aplicables a los mismos.</p>
            <p>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios disponibles, respetando la legalidad vigente y los derechos de terceros.</p>
        </Section>

        <Section title="3. Propiedad intelectual e industrial">
            <p>Todos los contenidos de este sitio web (textos, imágenes, logotipos, iconos, diseño gráfico, código fuente, etc.) son propiedad de <strong>María Concepción Ortega Yago</strong> o de terceros que han autorizado su uso, y están protegidos por la legislación española e internacional de propiedad intelectual e industrial.</p>
            <p>Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de estos contenidos sin autorización expresa y por escrito del titular.</p>
        </Section>

        <Section title="4. Responsabilidad">
            <p>El titular no garantiza la ausencia de errores en el acceso al sitio web ni en su contenido, y no será responsable de los daños que pudieran derivarse del uso de la información contenida en el mismo.</p>
            <p>El titular se reserva el derecho a modificar, suspender o eliminar el sitio web o cualquiera de sus contenidos o servicios sin previo aviso.</p>
        </Section>

        <Section title="5. Legislación aplicable y jurisdicción">
            <p>El presente Aviso Legal se rige en su totalidad por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor, salvo que la ley disponga otra cosa.</p>
        </Section>
    </LegalLayout>
);

// ─── POLÍTICA DE PRIVACIDAD ───────────────────────────────────────────────────
export const PoliticaPrivacidad = () => (
    <LegalLayout title="Política de Privacidad">
        <Section title="1. Responsable del tratamiento">
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Responsable:</strong> María Concepción Ortega Yago</li>
                <li><strong>NIF:</strong> 29074067C</li>
                <li><strong>Dirección:</strong> C. San Antonio, 5, bajo, 30510 Yecla, Murcia</li>
                <li><strong>Email:</strong> <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)' }}>hola@merakiartesano.es</a></li>
            </ul>
        </Section>

        <Section title="2. Datos que recopilamos y finalidad">
            <p>Recopilamos los siguientes datos personales con las finalidades indicadas:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '12px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Dato</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Finalidad</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Base legal</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        ['Nombre, email, teléfono, dirección', 'Gestión de pedidos y envíos', 'Ejecución de contrato'],
                        ['Email y contraseña', 'Acceso al club online (Club Creativo MERAKI)', 'Ejecución de contrato'],
                        ['Datos de pago', 'Procesamiento del pago (gestionado por Redsys/Caja Rural)', 'Ejecución de contrato'],
                        ['Email', 'Envío de confirmaciones de pedido y comunicaciones del servicio', 'Interés legítimo'],
                    ].map(([dato, fin, base], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={{ padding: '10px 14px' }}>{dato}</td>
                            <td style={{ padding: '10px 14px' }}>{fin}</td>
                            <td style={{ padding: '10px 14px' }}>{base}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Section>

        <Section title="3. ¿Con quién compartimos tus datos?">
            <p>No vendemos ni cedemos tus datos a terceros. Sin embargo, para prestar el servicio trabajamos con los siguientes proveedores que actúan como encargados del tratamiento:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Supabase Inc.</strong> — Infraestructura de base de datos y autenticación (servidores en UE)</li>
                <li><strong>Redsys / Caja Rural Central</strong> — Procesamiento de pagos (no accede a tus datos bancarios completos)</li>
                <li><strong>Vercel Inc.</strong> — Alojamiento del sitio web</li>
            </ul>
        </Section>

        <Section title="4. Conservación de los datos">
            <p>Conservamos tus datos personales el tiempo necesario para la prestación del servicio contratado y, posteriormente, durante los plazos legalmente establecidos:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li>Datos de pedidos: <strong>5 años</strong> (obligación fiscal y contable)</li>
                <li>Datos de cuenta del club: hasta que solicites la baja</li>
                <li>Datos de suscripción: mientras la suscripción esté activa + 1 año</li>
            </ul>
        </Section>

        <Section title="5. Tus derechos">
            <p>En cualquier momento puedes ejercer los siguientes derechos escribiendo a <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)' }}>hola@merakiartesano.es</a>:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti</li>
                <li><strong>Rectificación:</strong> corregir datos incorrectos</li>
                <li><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de tus datos</li>
                <li><strong>Limitación del tratamiento:</strong> solicitar que no se traten tus datos temporalmente</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en formato electrónico</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
            </ul>
            <p>Tienes derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>www.aepd.es</a>.</p>
        </Section>

        <Section title="6. Seguridad">
            <p>Adoptamos medidas técnicas y organizativas adecuadas para proteger tus datos personales frente a accesos no autorizados, pérdidas o alteraciones, incluyendo el cifrado de datos en tránsito (HTTPS) y en reposo.</p>
        </Section>
    </LegalLayout>
);

// ─── POLÍTICA DE COOKIES ──────────────────────────────────────────────────────
export const PoliticaCookies = () => (
    <LegalLayout title="Política de Cookies">
        <Section title="¿Qué son las cookies?">
            <p>Las cookies son pequeños archivos de texto que los sitios web guardan en tu dispositivo cuando los visitas. Se utilizan para recordar tus preferencias, mantener tu sesión activa y mejorar tu experiencia de navegación.</p>
        </Section>

        <Section title="¿Qué cookies utiliza esta web?">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '12px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Cookie</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Tipo</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Finalidad</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Duración</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        ['sb-[id]-auth-token', 'Necesaria', 'Mantiene la sesión del usuario en el club', 'Sesión'],
                        ['meraki_cookie_consent', 'Necesaria', 'Guarda tus preferencias de cookies', '1 año'],
                        ['idioma / language', 'Funcional', 'Recuerda el idioma seleccionado', 'Persistente'],
                    ].map(([nombre, tipo, fin, dur], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{nombre}</td>
                            <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    backgroundColor: tipo === 'Necesaria' ? '#dcfce7' : '#fef3c7',
                                    color: tipo === 'Necesaria' ? '#166534' : '#92400e',
                                }}>
                                    {tipo}
                                </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>{fin}</td>
                            <td style={{ padding: '10px 14px' }}>{dur}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p style={{ marginTop: '12px', fontSize: '0.88rem', color: '#64748b' }}>
                ℹ️ Esta web <strong>no utiliza cookies de publicidad, analytics ni seguimiento</strong> de terceros.
            </p>
        </Section>

        <Section title="¿Cómo gestionar o eliminar las cookies?">
            <p>Puedes gestionar tus preferencias en cualquier momento desde el banner de cookies que aparece al visitar la web, o directamente desde la configuración de tu navegador:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2.2' }}>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Microsoft Edge</a></li>
            </ul>
            <p>Ten en cuenta que deshabilitar las cookies necesarias puede afectar al funcionamiento de la web (p.ej. no podrás mantener la sesión en el club).</p>
        </Section>
    </LegalLayout>
);

// ─── CONDICIONES DE COMPRA ────────────────────────────────────────────────────
export const CondicionesCompra = () => (
    <LegalLayout title="Condiciones de Compra">
        <Section title="1. Identificación del vendedor">
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Titular:</strong> María Concepción Ortega Yago</li>
                <li><strong>NIF:</strong> 29074067C</li>
                <li><strong>Dirección:</strong> C. San Antonio, 5, bajo, 30510 Yecla, Murcia</li>
                <li><strong>Email:</strong> <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)' }}>hola@merakiartesano.es</a></li>
                <li><strong>Teléfono:</strong> 605 88 99 38</li>
            </ul>
        </Section>

        <Section title="2. Productos y servicios disponibles">
            <p>A través de <strong>merakiartesano.es</strong> se pueden adquirir dos tipos de productos:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Productos físicos</strong> (materiales de costura y mercería): se envían al domicilio indicado por el comprador.</li>
                <li><strong>Suscripción al Club Creativo MERAKI</strong> (club online): servicio de acceso a clases y contenidos digitales con facturación mensual recurrente.</li>
            </ul>
        </Section>

        <Section title="3. Proceso de compra">
            <ol style={{ paddingLeft: '20px', lineHeight: '2.2' }}>
                <li>Selecciona los productos y añádelos al carrito.</li>
                <li>Accede al carrito y pulsa "Finalizar compra".</li>
                <li>Rellena el formulario con tus datos de entrega.</li>
                <li>Revisa el resumen del pedido y el importe total (incluido el coste de envío).</li>
                <li>Pulsa "Pagar" y se redirigirá al TPV Virtual seguro de Caja Rural para completar el pago.</li>
                <li>Una vez confirmado el pago, recibirás un email de confirmación con los detalles del pedido.</li>
            </ol>
        </Section>

        <Section title="4. Precios e impuestos">
            <p>Todos los precios mostrados incluyen el <strong>IVA aplicable</strong> según la legislación española vigente. Los gastos de envío se muestran de forma desglosada antes de confirmar el pedido y varían según la zona geográfica de destino.</p>
        </Section>

        <Section title="5. Métodos de pago">
            <p>Aceptamos los siguientes métodos de pago:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Tarjeta bancaria</strong> (Visa, Mastercard, etc.) a través del TPV Virtual seguro de Redsys / Caja Rural Central. Los datos bancarios son procesados directamente por la entidad bancaria; en ningún momento son almacenados en nuestros servidores.</li>
            </ul>
        </Section>

        <Section title="6. Envíos y plazos de entrega">
            <p>Los pedidos se procesan y envían en días hábiles (lunes a viernes). Los plazos estimados son:</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li><strong>Península:</strong> 48-72 horas hábiles</li>
                <li><strong>Baleares:</strong> 3-5 días hábiles</li>
                <li><strong>Canarias, Ceuta y Melilla:</strong> 5-10 días hábiles</li>
                <li><strong>Portugal:</strong> 3-5 días hábiles</li>
            </ul>
            <p>Estas estimaciones son orientativas y pueden verse afectadas por circunstancias ajenas a nuestra voluntad (festivos, incidencias del transportista, etc.).</p>
        </Section>

        <Section title="7. Derecho de desistimiento">
            <p>De acuerdo con el <strong>Real Decreto Legislativo 1/2007 (TRLGDCU)</strong>, tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> desde la recepción del pedido, sin necesidad de indicar el motivo.</p>
            <p>Para ejercer este derecho, contacta con nosotros en <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)' }}>hola@merakiartesano.es</a> indicando el número de pedido. Los gastos de devolución correrán a cargo del comprador salvo que el producto llegue defectuoso o sea incorrecto.</p>
            <p><strong>Excepción:</strong> Los contenidos digitales descargados o el acceso al club una vez activado no son reembolsables, de acuerdo con el artículo 103.m) del TRLGDCU.</p>
        </Section>

        <Section title="8. Garantías y reclamaciones">
            <p>Los productos físicos disponen de una garantía legal de <strong>2 años</strong> contra defectos de fabricación, conforme a la normativa vigente. En caso de recibir un producto defectuoso o incorrecto, contacta con nosotros en los 14 días siguientes a la recepción y gestionaremos la sustitución o reembolso sin coste adicional.</p>
        </Section>

        <Section title="9. Suscripción al Club Creativo MERAKI">
            <p>La suscripción al club tiene una duración mensual y se renueva automáticamente cada mes. Puedes cancelar en cualquier momento desde tu área de cliente o contactando con nosotros. La cancelación aplicará al siguiente período de facturación; no se realizan reembolsos del período en curso.</p>
        </Section>

        <Section title="10. Legislación aplicable">
            <p>Las presentes condiciones se rigen por la legislación española. En caso de controversia, las partes acuerdan someterse a los Juzgados y Tribunales del domicilio del consumidor.</p>
        </Section>
    </LegalLayout>
);
