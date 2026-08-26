import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { POST_SUMMARY_FIELDS, Post, supabase } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { localizedPath } from '../lib/locale';

export default function RelatedPosts({ currentId, category }: { currentId: string; category: string | null }) {
  const { lang } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let query = supabase
        .from('posts')
        .select(POST_SUMMARY_FIELDS)
        .eq('published', true)
        .is('collection_type', null)
        .neq('id', currentId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (category) query = query.eq('category', category);
      const { data } = await query;
      if (!cancelled && data) setPosts(data as unknown as Post[]);
    };
    load();
    return () => { cancelled = true; };
  }, [category, currentId]);

  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-title" className="mt-16 pt-10 border-t border-navy/10">
      <h2 id="related-posts-title" className="font-serif text-2xl text-navy mb-6">
        {lang === 'es' ? 'También puede interesarte' : 'You may also be interested in'}
      </h2>
      <div className="grid md:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={localizedPath(`/blog/${post.slug}`, lang)}
            className="group border border-navy/10 bg-white rounded-sm overflow-hidden hover:border-gold/40 hover:shadow-md transition-all"
          >
            {post.cover_url && <img src={post.cover_url} alt={post.cover_alt || (lang === 'es' ? `Imagen de ${post.title_es}` : `Image for ${post.title_en}`)} loading="lazy" decoding="async" className="w-full aspect-[3/2] object-cover" />}
            <div className="p-4">
              <h3 className="font-serif text-lg text-navy leading-snug group-hover:text-gold transition-colors">
                {lang === 'es' ? post.title_es : post.title_en}
              </h3>
              <span className="inline-flex items-center gap-1 mt-4 text-xs text-gold">
                {lang === 'es' ? 'Leer artículo' : 'Read article'} <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
