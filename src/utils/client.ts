import { IInputs } from "../interface";
import Client from "@alicloud/agentrun20250910";
import { agentRunRegionEndpoints } from "../common/constant";
import * as $OpenApi from "@alicloud/openapi-client";

/**
 * 初始化 AgentRun 客户端
 * @param inputs 输入对象
 * @param region 区域
 * @param command 命令名称（用于 userAgent）
 * @returns AgentRun 客户端实例
 */
export async function initAgentRunClient(
  inputs: IInputs,
  region: string,
  command: string = "unknown",
): Promise<Client> {
  const {
    AccessKeyID: accessKeyId,
    AccessKeySecret: accessKeySecret,
    SecurityToken: securityToken,
  } = await inputs.getCredential();

  const endpoint = agentRunRegionEndpoints.get(region);
  if (!endpoint) {
    throw new Error(`no agentrun endpoint found for ${region}`);
  }

  const protocol = "https";
  const clientConfig = new $OpenApi.Config({
    accessKeyId,
    accessKeySecret,
    securityToken,
    protocol,
    endpoint: endpoint,
    readTimeout: 60000,
    connectTimeout: 5000,
    userAgent: `${
      inputs.userAgent ||
      `Component:agentrun;Nodejs:${process.version};OS:${process.platform}-${process.arch}`
    }command:${command}`,
  });

  return new Client(clientConfig);
}
