import { ARTICLE_IMAGES_BUCKET } from '../../../../lib/articleImageUtils';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const sanitizeFileName = (name) => {
  const base = (name || 'image').replace(/\.[^/.]+$/, '');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'image';
};

const extensionFromType = (mimeType) => {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/svg+xml') return 'svg';
  return 'bin';
};

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return Response.json(
      { error: 'Supabase管理キーが設定されていません。SUPABASE_SERVICE_ROLE_KEYを設定してください。' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file || typeof file === 'string') {
      return Response.json({ error: '画像ファイルを指定してください。' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return Response.json({ error: 'ユーザー情報が不足しています。' }, { status: 401 });
    }

    if (!file.type?.startsWith('image/')) {
      return Response.json({ error: '画像ファイルのみアップロードできます。' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return Response.json({ error: '画像サイズは10MB以下にしてください。' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionFromType(file.type);
    const safeName = sanitizeFileName(file.name);
    const path = `${userId}/${Date.now()}-${safeName}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ARTICLE_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('画像アップロード失敗:', uploadError);
      return Response.json({ error: '画像のアップロードに失敗しました。' }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(ARTICLE_IMAGES_BUCKET)
      .getPublicUrl(path);

    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) {
      return Response.json({ error: '画像URLの発行に失敗しました。' }, { status: 500 });
    }

    const alt = sanitizeFileName(file.name).replace(/-/g, ' ');

    return Response.json({
      url: imageUrl,
      path,
      markdown: `![${alt}](${imageUrl})`,
    });
  } catch (error) {
    console.error('画像アップロードAPIエラー:', error);
    return Response.json({ error: '画像アップロード中にエラーが発生しました。' }, { status: 500 });
  }
}
