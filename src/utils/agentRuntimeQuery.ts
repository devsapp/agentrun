import _ from "lodash";
import Client, {
  ListAgentRuntimesRequest,
  ListWorkspacesRequest,
} from "@alicloud/agentrun20250910";
import { IInputs } from "../interface";
import GLogger from "../common/logger";

/**
 * 根据工作空间名称获取工作空间ID
 */
export async function getWorkspaceIdByName(
  client: Client,
  workspaceName: string,
): Promise<string | null> {
  const logger = GLogger.getLogger();
  try {
    const listRequest = new ListWorkspacesRequest();
    listRequest.pageNumber = "1";
    listRequest.pageSize = "100";
    listRequest.name = workspaceName;

    const result = await client.listWorkspaces(listRequest);

    if (result.statusCode === 200 && result.body?.data?.workspaces) {
      const workspace = result.body.data.workspaces.find(
        (w: any) => w.name === workspaceName,
      );
      return workspace?.workspaceId || null;
    }
    return null;
  } catch (error: any) {
    logger.warn(
      `Failed to find workspace by name '${workspaceName}': ${error.message}`,
    );
    return null;
  }
}

/**
 * 获取默认工作空间ID（isDefault: true）
 */
export async function getDefaultWorkspaceId(
  client: Client,
): Promise<string | null> {
  const logger = GLogger.getLogger();
  try {
    const listRequest = new ListWorkspacesRequest();
    listRequest.pageNumber = "1";
    listRequest.pageSize = "100";

    const result = await client.listWorkspaces(listRequest);
    if (result.statusCode === 200 && result.body?.data?.workspaces) {
      const defaultWorkspace = result.body.data.workspaces.find(
        (w: any) => w.isDefault === true,
      );
      return defaultWorkspace?.workspaceId || null;
    }
    return null;
  } catch (error: any) {
    logger.warn(`Failed to find default workspace: ${error.message}`);
    return null;
  }
}

/**
 * 解析工作空间ID
 * @param client AgentRun客户端实例
 * @param inputs 命令行输入上下文（用于sync）
 * @param workspaceId 用户提供的工作空间ID
 * @param workspaceName 用户提供的工作空间名称
 * @returns 解析后的工作空间ID，如果都不提供则返回默认工作空间ID
 */
export async function resolveWorkspaceId(
  client: Client,
  inputs: IInputs,
  workspaceId?: string,
  workspaceName?: string,
): Promise<string | undefined> {
  const logger = GLogger.getLogger();
  // 情况1: 用户提供了workspaceId，直接返回
  if (workspaceId) {
    logger.debug(`DEBUG: Using provided workspace ID: ${workspaceId}`);
    return workspaceId;
  }

  // 情况2: 用户提供了workspaceName，需要查询对应的ID
  if (workspaceName) {
    logger.debug(`DEBUG: Resolving workspace name to ID: ${workspaceName}`);
    const resolvedId = await getWorkspaceIdByName(client, workspaceName);
    if (!resolvedId) {
      throw new Error(`Workspace with name '${workspaceName}' not found`);
    }
    return resolvedId;
  }

  // 情况3: 用户都没有提供，查询默认工作空间
  logger.debug(
    "DEBUG: No workspace ID or name provided, looking for default workspace",
  );
  const defaultWorkspaceId = await getDefaultWorkspaceId(client);
  if (defaultWorkspaceId) {
    return defaultWorkspaceId;
  }

  // 情况4: 都没有找到，提示用户必须提供
  throw new Error(
    "No default workspace found. Please specify either --workspace-id or --workspace-name",
  );
}

/**
 * 根据Agent名称和工作空间ID获取Agent Runtime ID
 * @param client AgentRun客户端实例
 * @param agentName Agent名称
 * @param workspaceId 工作空间ID（可选）
 * @returns Agent Runtime ID
 */
export async function getAgentRuntimeIdByWorkspace(
  client: Client,
  agentName: string,
  workspaceId?: string,
): Promise<string> {
  const logger = GLogger.getLogger();
  const listRequest = new ListAgentRuntimesRequest();
  listRequest.agentRuntimeName = agentName;
  listRequest.pageNumber = 1;
  listRequest.pageSize = 100;
  listRequest.searchMode = "exact";

  if (workspaceId) {
    logger.debug(
      `DEBUG: Searching for agent '${agentName}' in specific workspace: ${workspaceId}`,
    );
    listRequest.workspaceIds = workspaceId;
  }

  try {
    const result = await client.listAgentRuntimes(listRequest);
    if (result.statusCode === 200 && result.body?.data?.items) {
      const runtime = result.body.data.items.find(
        (item: any) => item.agentRuntimeName === agentName,
      );
      if (runtime && runtime.agentRuntimeId) {
        return runtime.agentRuntimeId;
      }
    }

    if (workspaceId) {
      logger.debug(
        `Agent runtime '${agentName}' not found in workspace '${workspaceId}'`,
      );
    } else {
      logger.debug(`Agent runtime '${agentName}' not found without workspace`);
    }
    return "";
  } catch (error: any) {
    throw error;
  }
}
