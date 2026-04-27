import _ from "lodash";
import Client, { GetAgentRuntimeRequest } from "@alicloud/agentrun20250910";
import { IInputs } from "../../interface";
import { AgentRuntimeInfo } from "./types";
import { initAgentRunClient } from "../../utils/client";

export class AgentRuntimeAPI {
  private client?: Client;
  private inputs: IInputs;
  private region: string;

  constructor(inputs: IInputs, region: string) {
    this.inputs = inputs;
    this.region = region;
  }

  /**
   * 获取客户端实例
   */
  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = await initAgentRunClient(this.inputs, this.region, "sync");
    }
    return this.client;
  }

  /**
   * 获取完整的 Agent Runtime 信息 (兼容原有接口)
   * 主要用于补充缺失的字段（如endpoints）
   */
  public async getCompleteAgentRuntimeInfo(
    runtimeId: string,
  ): Promise<AgentRuntimeInfo> {
    const client = await this.getClient();
    const getRequest = new GetAgentRuntimeRequest();

    try {
      const result = await client.getAgentRuntime(runtimeId, getRequest);
      if (result.statusCode !== 200) {
        throw new Error(
          `Failed to get agent runtime info, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
      }

      if (!result.body?.data) {
        throw new Error(`No agent runtime data found for ${runtimeId}`);
      }

      const agentRuntimeData: any = result.body.data;

      // 确保必需字段存在
      if (!agentRuntimeData.agentRuntimeId) {
        throw new Error(
          `Agent runtime data missing required field 'agentRuntimeId'`,
        );
      }
      if (!agentRuntimeData.agentRuntimeName) {
        throw new Error(
          `Agent runtime data missing required field 'agentRuntimeName'`,
        );
      }

      return agentRuntimeData;
    } catch (error: any) {
      throw error;
    }
  }
}
