import * as fs from "fs";
import * as path from "path";
import GLogger from "../common/logger";

/**
 * Read a local file and convert it to base64 string
 * @param filePath - Local file path (can be relative or absolute)
 * @param baseDir - Base directory for resolving relative paths
 * @returns Base64 encoded string
 */
export function readFileToBase64(filePath: string, baseDir: string): string {
  const logger = GLogger.getLogger();
  let absolutePath: string;

  if (path.isAbsolute(filePath)) {
    absolutePath = filePath;
  } else {
    absolutePath = path.resolve(baseDir, filePath);
  }

  logger.debug(`Reading file: ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const base64String = fileBuffer.toString("base64");

  logger.debug(`File read successfully, size: ${fileBuffer.length} bytes`);

  return base64String;
}
