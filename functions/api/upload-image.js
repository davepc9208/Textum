import { createClient } from '@supabase/supabase-js';
import {
  corsHeaders,
  getRequestId,
  jsonResponse,
  log,
  requireAdmin,
  validateImageBytes,
} from '../_shared/security.js';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/webp', 'image/jpeg']);

export function onRequestOptions({ request, env }) {
  return new Response(null, { headers: corsHeaders(request, env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_IMAGE_BYTES + 128 * 1024) {
    return jsonResponse({ error: 'La imagen supera el tamaño máximo permitido.' }, 413, request, env, requestId);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: 'Formulario de imagen inválido.' }, 400, request, env, requestId);
  }

  const entry = form.get('file');
  if (!(entry instanceof File)) {
    return jsonResponse({ error: 'Debes enviar un archivo en el campo file.' }, 400, request, env, requestId);
  }
  if (entry.size === 0 || entry.size > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'La imagen debe pesar entre 1 byte y 2 MB.' }, 413, request, env, requestId);
  }
  if (!IMAGE_TYPES.has(entry.type)) {
    return jsonResponse({ error: 'Formato no permitido. Usa PNG, WebP o JPEG.' }, 415, request, env, requestId);
  }

  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (!validateImageBytes(bytes, entry.type)) {
    return jsonResponse({ error: 'El contenido no coincide con el formato declarado.' }, 415, request, env, requestId);
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    log('error', 'upload.configuration_missing', { requestId, userId: auth.user.id });
    return jsonResponse({ error: 'Servicio de almacenamiento no configurado.' }, 503, request, env, requestId);
  }

  const extension = entry.type === 'image/png' ? 'png' : entry.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `articles/${crypto.randomUUID()}.${extension}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.storage.from('blog-images').upload(path, bytes, {
    contentType: entry.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    log('error', 'upload.storage_failed', { requestId, userId: auth.user.id, message: error.message });
    return jsonResponse({ error: 'No se pudo guardar la imagen.' }, 502, request, env, requestId);
  }

  const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
  log('info', 'upload.completed', { requestId, userId: auth.user.id, bytes: entry.size, type: entry.type });
  return jsonResponse({ success: true, url: data.publicUrl }, 201, request, env, requestId);
}
