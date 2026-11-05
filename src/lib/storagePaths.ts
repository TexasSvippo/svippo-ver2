// Storage object paths vs. public URLs.
//
// Older rows store the full public URL (…/storage/v1/object/public/<bucket>/<path>);
// newer rows store just <path>. This returns the path for either form, so code
// works before and after existing values are converted. Pure function: safe to
// use on both server and client.
export function toStoragePath(value: string | null | undefined, bucket: string): string | null {
  if (!value) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = value.indexOf(marker)
  const path = i >= 0 ? decodeURIComponent(value.slice(i + marker.length).split('?')[0]) : value
  // Never accept something that still looks like a URL or tries to escape its folder.
  if (/^[a-z]+:\/\//i.test(path) || path.includes('..') || path.startsWith('/')) return null
  return path
}
