const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
}

async function decodeHeicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
  return Array.isArray(result) ? result[0] : result
}

/**
 * Converts HEIC/HEIF to JPEG (canvas can't decode HEIC), scales down to
 * MAX_DIMENSION on the longest side, and re-encodes as JPEG. Uses
 * createImageBitmap with imageOrientation: 'from-image' so EXIF rotation
 * from phone cameras is respected instead of silently ignored.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const source: Blob = isHeic(file) ? await decodeHeicToJpeg(file) : file

  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })

  let { width, height } = bitmap
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIMENSION)
      width = MAX_DIMENSION
    } else {
      width = Math.round((width / height) * MAX_DIMENSION)
      height = MAX_DIMENSION
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}
