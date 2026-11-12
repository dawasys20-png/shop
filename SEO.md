# Product search visibility

Product pages load their server-rendered metadata and Product structured data from the backend catalog. The sitemap at `/sitemap.xml` also lists the current backend products, while `/robots.txt` allows public product pages and excludes private/admin flows.

Set these frontend environment variables in the production build/deployment. `NEXT_PUBLIC_*` values are included in the build output, so configure them before building:

- `NEXT_PUBLIC_API_URL`: the public backend API base URL, ending in `/api` (for example `https://api.example.com/api`). The server also accepts `API_URL` for server-only backend access; use it if the backend URL should not be exposed in the browser bundle.
- `NEXT_PUBLIC_SITE_URL`: the canonical public storefront origin (for example `https://shop.example.com`), with no path after the domain.

After deployment, verify `https://<your-domain>/robots.txt`, `https://<your-domain>/sitemap.xml`, and the page source for `/products/<product-id>`. Submit the sitemap in Google Search Console. Metadata and structured data help search engines understand product pages but do not guarantee indexing or search placement.
