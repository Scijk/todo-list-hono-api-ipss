// Utility para extraer el key de R2 desde una URL de imagen
export const extractImageKeyFromUrl = (url: string | undefined): string | null => {
  if (!url) return null

  // URL format: /images/userId/imageId.ext o full URL
  const match = url.match(/\/images\/([^/]+\/[^/]+)/)
  return match ? match[1] : null
}

// Utility para eliminar imagen de R2
export const deleteImageFromR2 = async (
  bucket: R2Bucket,
  imageUrl: string | undefined,
): Promise<void> => {
  const imageKey = extractImageKeyFromUrl(imageUrl)
  if (imageKey) {
    try {
      await bucket.delete(imageKey)
    } catch (error) {
      console.error('Error deleting image from R2:', error)
    }
  }
}
