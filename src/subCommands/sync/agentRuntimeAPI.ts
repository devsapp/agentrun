import _ from "lodash";
import Client, {
  ListAgentRuntimesRequest,
  ListWorkspacesRequest,
  GetAgentRuntimeRequest,
} from "@alicloud/agentrun20250910";
import { agentRunRegionEndpoints } from "../../common/constant";
import * as $OpenApi from "@alicloud/openapi-client";
import { IInputs } from "../../interface";
import { AgentRuntimeInfo } from "./types";
import GLogger from "../../common/logger";

// 移除 logger 导入和使用
// const logger = GLogger.getLogger();
let logger: any;

export class AgentRuntimeAPI {
  private client?: Client;
  private inputs: IInputs;
  private region: string;

  constructor(inputs: IInputs, region: string) {
    this.inputs = inputs;
    this.region = region;
    logger = GLogger.getLogger();
  }

  /**
   * 初始化 Agent Runtime 客户端
   */
  private async initClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const {
      AccessKeyID: accessKeyId,
      AccessKeySecret: accessKeySecret,
      SecurityToken: securityToken,
    } = await this.inputs.getCredential();

    const endpoint = agentRunRegionEndpoints.get(this.region);
    if (!endpoint) {
      throw new Error(`no agentrun endpoint found for ${this.region}`);
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
        this.inputs.userAgent ||
        `Component:agentrun;Nodejs:${process.version};OS:${process.platform}-${process.arch}`
      }command:sync`,
    });

    this.client = new Client(clientConfig);
    return this.client;
  }

  /**
   * 获取所有工作空间ID列表
   */
  public async getAllWorkspaceIds(): Promise<string[]> {
    const client = await this.initClient();
    try {
      const listRequest = new ListWorkspacesRequest();
      listRequest.pageNumber = "1";
      listRequest.pageSize = "100";

      logger.info(
        `==DEBUG: listWorkspaces called with request: ${JSON.stringify(listRequest)}`,
      );
      const result = await client.listWorkspaces(listRequest);
      if (result.statusCode === 200 && result.body?.data?.workspaces) {
        const workspaceIds = result.body.data.workspaces
          .map((w) => w.workspaceId)
          .filter((id) => id) as string[];
        return workspaceIds;
      }
      // console.info("DEBUG: No workspaces found");
      return [];
    } catch (error: any) {
      // console.warn(`DEBUG: Failed to list workspaces: ${error.message}`);
      return [];
    }
  }

  /**
   * 在指定workspace IDs中查找Agent Runtime
   */
  private async findAgentInWorkspaces(
    workspaceIds: string[],
    agentName: string,
  ): Promise<string | null> {
    if (workspaceIds.length === 0) {
      return null;
    }

    const client = await this.initClient();
    const listRequest = new ListAgentRuntimesRequest();
    listRequest.agentRuntimeName = agentName;
    listRequest.pageNumber = 1;
    listRequest.pageSize = 100;
    listRequest.searchMode = "exact";
    listRequest.workspaceIds = workspaceIds.join(",");

    // console.info(`DEBUG: Searching in workspaces: ${listRequest.workspaceIds}`);

    try {
      const result = await client.listAgentRuntimes(listRequest);
      if (result.statusCode === 200 && !_.isEmpty(result.body?.data?.items)) {
        const runtime = result.body.data.items.find(
          (item) => item.agentRuntimeName == agentName,
        );
        if (runtime && runtime.agentRuntimeId) {
          return runtime.agentRuntimeId;
        }
      }
      return null;
    } catch (error: any) {
      // console.debug(`DEBUG: Failed to search in workspaces: ${error.message}`);
      return null;
    }
  }

  /**
   * 在无workspace的agents中查找Agent Runtime
   */
  private async findAgentWithoutWorkspace(
    agentName: string,
  ): Promise<string | null> {
    const client = await this.initClient();
    const listRequest = new ListAgentRuntimesRequest();
    listRequest.agentRuntimeName = agentName;
    listRequest.pageNumber = 1;
    listRequest.pageSize = 100;
    listRequest.searchMode = "exact";

    // console.info("DEBUG: Searching agents without workspace...");

    try {
      const result = await client.listAgentRuntimes(listRequest);
      if (result.statusCode === 200 && !_.isEmpty(result.body?.data?.items)) {
        const runtime = result.body.data.items.find(
          (item) => item.agentRuntimeName == agentName,
        );
        if (runtime && runtime.agentRuntimeId) {
          return runtime.agentRuntimeId;
        }
      }
      return null;
    } catch (error: any) {
      // console.debug(`DEBUG: Failed to search without workspace: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取 Agent Runtime ID
   */
  public async getAgentRuntimeId(agentName: string): Promise<string> {
    // console.info(`=== DEBUG: getAgentRuntimeId called for agent: ${agentName} ===`);

    // 策略1: 先获取所有workspace IDs并查询
    const workspaceIds = await this.getAllWorkspaceIds();
    logger.info(`==DEBUG: workspaceIds: ${workspaceIds}`);
    if (workspaceIds.length > 0) {
      const runtimeIdInWorkspaces = await this.findAgentInWorkspaces(
        workspaceIds,
        agentName,
      );
      if (runtimeIdInWorkspaces) {
        // console.info(`DEBUG: Found agent runtime ID in workspaces: ${runtimeIdInWorkspaces}`);
        return runtimeIdInWorkspaces;
      }
    }

    // 策略2: 查询无workspace的agents
    const runtimeIdWithoutWorkspace =
      await this.findAgentWithoutWorkspace(agentName);
    if (runtimeIdWithoutWorkspace) {
      // console.info(`DEBUG: Found agent runtime ID without workspace: ${runtimeIdWithoutWorkspace}`);
      return runtimeIdWithoutWorkspace;
    }

    // 都没找到
    throw new Error(
      `Agent runtime ${agentName} not found in any workspace or without workspace`,
    );
  }

  /**
   * 获取完整的 Agent Runtime 信息
   */
  public async getCompleteAgentRuntimeInfo(
    runtimeId: string,
  ): Promise<AgentRuntimeInfo> {
    // console.info(`=== DEBUG: getCompleteAgentRuntimeInfo called for runtimeId: ${runtimeId} ===`);

    const client = await this.initClient();
    const getRequest = new GetAgentRuntimeRequest({});

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

      // console.info("DEBUG: Successfully retrieved complete agent runtime info");
      return result.body.data;
    } catch (error: any) {
      // console.error(`Failed to get complete agent runtime info: ${error.message}`);
      throw error;
    }
  }
}
