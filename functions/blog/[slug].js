/**
 * Cloudflare Pages Function — Renderizado dinámico de blog posts para SEO
 * Ruta: /blog/[slug]
 * 
 * Genera HTML con metadatos Open Graph dinámicos basados en datos de Supabase
 */

const SUPABASE_URL = 'https://didxrqnhnxbhskdazkzz.supabase.co';
const TIMEOUT_MS = 5000;

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
    <link rel="modulepreload" href="/assets/app.js" />
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"><\/script>
</body>
</html>
`;

async function fetchPost(slug, apiKey) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`,
            {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Supabase error:', response.status);
            return null;
        }

        const posts = await response.json();
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error('Error fetching post:', error.name || error.message);
        return null;
    }
}

function escapeHtml(text) {
    if (!text) return '';
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
    let title, description, image, url, publishedTime, author;

    if (post) {
        title = `${lang === 'en' ? post.title_en : post.title_es} — TEXTUM Mentoría Académica`;
        description = (lang === 'en' ? post.excerpt_en : post.excerpt_es).slice(0, 155);
        image = post.cover_url || 'https://mentoriatextum.com/og-default.png';
        url = `https://mentoriatextum.com/blog/${post.slug}`;
        publishedTime = post.created_at;
        author = post.author;
    } else {
        title = 'Artículo — TEXTUM Mentoría Académica';
        description = 'Artículo académico del blog de TEXTUM';
        image = 'https://mentoriatextum.com/og-default.png';
        url = `https://mentoriatextum.com/blog/${slug}`;
        publishedTime = new Date().toISOString();
        author = 'TEXTUM — Mentoría Académica';
    }

    return BASE_HTML_TEMPLATE
        .replace(/{{TITLE}}/g, escapeHtml(title))
        .replace(/{{DESCRIPTION}}/g, escapeHtml(description))
        .replace(/{{IMAGE}}/g, image)
        .replace(/{{URL}}/g, url)
        .replace(/{{PUBLISHED_TIME}}/g, publishedTime)
        .replace(/{{AUTHOR}}/g, escapeHtml(author));
}

export async function onRequest(context) {
    const { request, params, env } = context;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const slug = params.slug;
    if (!slug) {
        return new Response('Not Found', { status: 404 });
    }

    try {
        let post = null;
        const apiKey = env.VITE_SUPABASE_ANON_KEY;

        if (apiKey) {
            post = await fetchPost(slug, apiKey);
        }

        const lang = url.searchParams.get('lang') || 'es';
        const html = generateHTML(post, slug, lang);

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=1800, s-maxage=1800',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Error:', error.message);
        const html = generateHTML(null, slug, 'es');
        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
            },
        });
    }
}
