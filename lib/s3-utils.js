/**
 * AWS S3 upload utilities
 * This file contains helper functions for S3 operations
 */

/**
 * Configuration for S3 upload
 * In a production environment, these would come from environment variables
 */
export const S3_CONFIG = {
  // These would be set via environment variables in production
  BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "yaml-workflows-bucket",
  REGION: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  // Note: Never expose AWS credentials in client-side code
  // Use AWS Cognito, STS, or server-side proxy for secure uploads
}

/**
 * Validates filename for S3 upload
 * @param {string} filename - The filename to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateS3Filename(filename) {
  if (!filename || typeof filename !== "string") {
    return { isValid: false, error: "Filename is required" }
  }

  // Remove leading/trailing whitespace
  const trimmed = filename.trim()

  if (trimmed.length === 0) {
    return { isValid: false, error: "Filename cannot be empty" }
  }

  if (trimmed.length > 255) {
    return { isValid: false, error: "Filename too long (max 255 characters)" }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/
  if (invalidChars.test(trimmed)) {
    return { isValid: false, error: "Filename contains invalid characters" }
  }

  // Check for reserved names
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ]
  const nameWithoutExt = trimmed.split(".")[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return { isValid: false, error: "Filename uses a reserved name" }
  }

  return { isValid: true }
}

/**
 * Ensures filename has proper YAML extension
 * @param {string} filename - The filename to process
 * @returns {string} - Filename with .yaml extension
 */
export function ensureYamlExtension(filename) {
  const trimmed = filename.trim()

  if (trimmed.endsWith(".yaml") || trimmed.endsWith(".yml")) {
    return trimmed
  }

  return `${trimmed}.yaml`
}

/**
 * Generates a default filename based on current timestamp
 * @param {string} [prefix='workflow'] - Prefix for the filename
 * @returns {string} - Generated filename
 */
export function generateDefaultFilename(prefix = "workflow") {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-").replace("T", "_")

  return `${prefix}-${timestamp}.yaml`
}

/**
 * Calculates file size in human-readable format
 * @param {string} content - The file content
 * @returns {string} - Human-readable file size
 */
export function getFileSize(content) {
  const bytes = new Blob([content]).size

  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Simulates S3 upload (for demonstration)
 * In production, this would use AWS SDK or server-side API
 * @param {Object} params - Upload parameters
 * @param {string} params.filename - The filename
 * @param {string} params.content - The file content
 * @param {function} [params.onProgress] - Progress callback
 * @returns {Promise<Object>} - Upload result
 */
export async function simulateS3Upload({ filename, content, onProgress }) {
  // Simulate upload progress
  const steps = 10
  const delay = 200

  for (let i = 0; i <= steps; i++) {
    if (onProgress) {
      onProgress((i / steps) * 100)
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  // Simulate successful upload
  return {
    success: true,
    location: `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${filename}`,
    bucket: S3_CONFIG.BUCKET_NAME,
    key: filename,
    etag: `"${Math.random().toString(36).substr(2, 9)}"`,
    size: new Blob([content]).size,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * Real S3 upload function (commented out for security)
 * This would be implemented server-side or with proper authentication
 */
/*
export async function uploadToS3({ filename, content, credentials }) {
  const AWS = require('aws-sdk');
  
  const s3 = new AWS.S3({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken, // if using temporary credentials
    region: S3_CONFIG.REGION
  });

  const uploadParams = {
    Bucket: S3_CONFIG.BUCKET_NAME,
    Key: filename,
    Body: content,
    ContentType: 'application/x-yaml',
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-by': 'yaml-builder',
      'upload-timestamp': new Date().toISOString()
    }
  };

  try {
    const result = await s3.upload(uploadParams).promise();
    return {
      success: true,
      location: result.Location,
      bucket: result.Bucket,
      key: result.Key,
      etag: result.ETag
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
*/
