import fs_extra from "fs-extra";
import downloads from "@serverless-devs/downloads";

/**
 * 从 OSS 下载代码（通过 bucket 和 object name）
 */
export async function downloadCodeFromOSS(
  ossBucketName: string,
  ossObjectName: string,
  region: string,
  codePath: string,
  baseDir: string,
): Promise<string> {
  const ossEndpoint = `https://${ossBucketName}.oss-${region}.aliyuncs.com`;
  const downloadUrl = `${ossEndpoint}/${ossObjectName}`;

  await fs_extra.removeSync(codePath);

  let codeUrl = downloadUrl;
  if (process.env.FC_REGION === region) {
    codeUrl = downloadUrl.replace(".aliyuncs.com", "-internal.aliyuncs.com");
  }

  await downloads(codeUrl, {
    dest: codePath,
    extract: true,
  });

  return codePath;
}

/**
 * 从 URL 下载代码（通过 FC API 获取的临时 URL）
 */
export async function downloadCodeFromURL(
  codeUrl: string,
  region: string,
  codePath: string,
): Promise<string> {
  await fs_extra.removeSync(codePath);

  // 如果在同一区域，使用内网地址加速
  let finalUrl = codeUrl;
  if (process.env.FC_REGION === region) {
    finalUrl = codeUrl.replace(".aliyuncs.com", "-internal.aliyuncs.com");
  }

  await downloads(finalUrl, {
    dest: codePath,
    extract: true,
  });

  return codePath;
}

/**
 * 获取函数名称（带agentrun前缀）
 */
export function getFunctionName(runtimeId: string): string {
  const functionName = `agentrun-${runtimeId}`;
  return functionName;
}
