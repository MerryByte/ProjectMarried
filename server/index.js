export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/upload-config") {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return Response.json(
          { error: "Photo uploads are not configured yet." },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }

      return Response.json(
        {
          supabaseUrl: env.SUPABASE_URL.replace(/\/$/, ""),
          anonKey: env.SUPABASE_ANON_KEY,
          bucket: "wedding-uploads",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return env.ASSETS.fetch(request);
  }
};
