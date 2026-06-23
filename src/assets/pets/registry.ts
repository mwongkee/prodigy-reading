/**
 * Auto-discovers generated pet sprites. Drop a PNG named after the pet's art
 * `src` (e.g. `flickit.png`) into ./generated/ and it becomes available with no
 * code change. Until a file exists, `petImage` returns undefined and the UI
 * falls back to a placeholder (see Placeholder.tsx).
 */
const modules = import.meta.glob('./generated/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byFilename: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split('/').pop();
  if (filename) byFilename[filename] = url;
}

/** Resolve a pet art `src` (filename) to a bundled image URL, if present. */
export function petImage(src: string): string | undefined {
  return byFilename[src];
}
