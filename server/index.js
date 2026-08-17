export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const supabaseUrl = (env.SUPABASE_URL || "https://api.anatoliy-and-elizabeth.com").replace(/\/$/, "");
    const anonKey = env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

    if (url.pathname === "/api/upload-config") {
      return Response.json(
        {
          supabaseUrl,
          anonKey,
          bucket: "wedding-uploads",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (url.pathname === "/api/site-settings") {
      const fields = url.searchParams.get("select") || "upload_unlock_at,ceremony_time,ceremony_location,celebration_time,celebration_location";
      const endpoint = `${supabaseUrl}/rest/v1/site_settings?select=${encodeURIComponent(fields)}&id=eq.wedding&limit=1`;
      return fetch(endpoint, { headers: { apikey: anonKey } }).then(async upstream =>
        new Response(upstream.body, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        })
      );
    }

    return env.ASSETS.fetch(request).then(response => {
      if (url.pathname !== "/admin.html") return response;
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(response.body, { status: response.status, headers });
    });
  }
};
