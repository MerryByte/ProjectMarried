# Wedding photo upload setup

## 1. Make Supabase reachable

Wedding guests must be able to reach the Supabase API over a public HTTPS URL. A LAN address such as `192.168.x.x` only works while connected to your home Wi-Fi.

For LAN testing, copy `config.example.js` to `config.js`, enter the self-hosted Supabase anon key, and serve the project over HTTP on the same network.

## 2. Create the private Storage bucket

Open the self-hosted Supabase Dashboard SQL editor and run `supabase/storage-setup.sql` once.

The policy permits anonymous uploads only. Guests cannot list, view, overwrite, or delete uploaded photos.

## 3. Configure the deployed website

Add these runtime environment variables to the website deployment:

- `SUPABASE_URL`: the public HTTPS base URL for the self-hosted Supabase API
- `SUPABASE_ANON_KEY`: the public `ANON_KEY` from the self-hosted Supabase `.env`

Never use `SERVICE_ROLE_KEY` here.

## 4. Allow the website origin

If browser uploads are blocked by CORS, add the deployed website origin to the self-hosted Supabase allowed origins and restart the Supabase services.

## 5. Verify

Upload a small JPEG from the website, then confirm it appears in Storage under:

`wedding-uploads/guest/YYYY-MM-DD/`
