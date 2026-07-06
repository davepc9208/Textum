/**
 * Cloudflare Pages Function — Renderizado dinámico de blog posts para SEO
 * Ruta: /blog/[slug]
 * 
 * Esta función intercepta requests a /blog/[slug] y retorna el HTML con
 * metadatos Open Graph dinámicos basados en los datos del post en Supabase.
 */

const SUPABASE_URL = 'https://didxrqnhnxbhskdazkzz.supabase.co';
const BASE_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}" />
    <meta property="og:title" content="{{TITLE}}" />
    <meta property="og:description" content="{{DESCRIPTION}}" />
    <meta property="og:image" content="{{IMAGE}}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="{{URL}}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="TEXTUM — Mentoría Académica" />
    <meta property="article:published_time" content="{{PUBLISHED_TIME}}" />
    <meta property="article:author" content="{{AUTHOR}}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{{TITLE}}" />
    <meta name="twitter:description" content="{{DESCRIPTION}}" />
    <meta name="twitter:image" content="{{IMAGE}}" />
    <link rel="canonical" href="{{URL}}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{{TITLE}}",
        "description": "{{DESCRIPTION}}",
        "image": "{{IMAGE}}",
        "datePublished": "{{PUBLISHED_TIME}}",
        "author": {
            "@type": "Person",
            "name": "{{AUTHOR}}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "TEXTUM — Mentoría Académica",
            "logo": {
                "@type": "ImageObject",
                "url": "https://mentoriatextum.com/favicon.svg"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "{{URL}}"
        }
    }
    </script>
    <meta name="theme-color" content="#0d1f3c" />
    <!-- Redirigir a la aplicación React después de que los bots hayan leído los metadatos -->
    <script>
        if (typeof document !== 'undefined') {
            window.location.href = '/blog/{{SLUG}}';
        }
    </script>
</head>
<body>
    <noscript>
        <p>Por favor, habilita JavaScript para ver este contenido.</p>
    </noscript>
</body>
</html>
`;

async function fetchPost(slug, apiKey) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`,
            {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Supabase error:', response.status, response.statusText);
            return null;
        }

        const posts = await response.json();
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

function generateHTML(post, slug, lang = 'es') {
    const title = `${lang === 'en' ? post.title_en : post.title_es} — TEXTUM Mentoría Académica`;
    const description = escapeHtml((lang === 'en' ? post.excerpt_en : post.excerpt_es).slice(0, 155));
    const image = post.cover_url || 'https://mentoriatextum.com/og-default.png';
    const url = `https://mentoriatextum.com/blog/${post.slug}`;
    const publishedTime = post.created_at;
    const author = escapeHtml(post.author);

    return BASE_HTML_TEMPLATE
        .replace(/{{TITLE}}/g, escapeHtml(title))
        .replace(/{{DESCRIPTION}}/g, description)
        .replace(/{{IMAGE}}/g, image)
        .replace(/{{URL}}/g, url)
        .replace(/{{PUBLISHED_TIME}}/g, publishedTime)
        .replace(/{{AUTHOR}}/g, author)
        .replace(/{{SLUG}}/g, slug);
}

export async function onRequest(context) {
    const { request, params, env } = context;
    const url = new URL(request.url);
    
    // Solo GET requests
    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Extraer slug de los parámetros
    const slug = params.slug;
    
    if (!slug) {
        return new Response('Not Found', { status: 404 });
    }

    try {
        // Obtener el API key de variables de entorno
        const apiKey = env.VITE_SUPABASE_ANON_KEY;
        if (!apiKey) {
            console.error('VITE_SUPABASE_ANON_KEY no está configurada');
            // Permitir que siga a la app React
            return new Response('Not Found', { status: 404 });
        }

        // Fetch del post
        const post = await fetchPost(slug, apiKey);

        if (!post) {
            // Post no encontrado - dejar que React maneje la ruta
            return new Response('Not Found', { status: 404 });
        }

        // Detectar idioma de la query string
        const lang = url.searchParams.get('lang') || 'es';

        // Generar HTML con metadatos dinámicos
        const html = generateHTML(post, slug, lang);

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache por 1 hora
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Error en función /blog/[slug]:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
