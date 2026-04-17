import fs_extra from "fs-extra";
import path from "path";
import downloads from "@serverless-devs/downloads";

/**
 * 从OSS下载代码
 */
export async function downloadCodeFromOSS(
  ossBucketName: string,
  ossObjectName: string,
  region: string,
  codePath: string,
  baseDir: string,
): Promise<string> {
  // 构造 OSS 下载 URL
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
 * 获取函数名称（带agentrun前缀）
 */
export function getFunctionName(runtimeId: string): string {
  const functionName = `agentrun-${runtimeId}`;
  return functionName;
}
