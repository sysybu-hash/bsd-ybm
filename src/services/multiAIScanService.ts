/**
 * Extracts AI-derived metadata (vendor, date) from a merged scan result
 * for consistent use when uploading to Google Drive folder structure.
 */
export function getAiMetadataForDrive(merged: Record<string, unknown>): {
  aiVendor?: string;
  aiDate?: string;
} {
  const aiVendor =
    (merged.aiVendor as string) ??
    (merged.providerName as string) ??
    (merged.supplier as string) ??
    (merged.vendor as string);

  const aiDate =
    (merged.aiDate as string) ??
    (merged.date as string) ??
    (merged.documentDate as string);

  return {
    ...(aiVendor && { aiVendor: String(aiVendor).trim() }),
    ...(aiDate && { aiDate: String(aiDate).trim() }),
  };
}
