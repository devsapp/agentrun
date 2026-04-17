import _ from "lodash";
import { AgentRuntimeInfo, FunctionConfig } from "./types";
import GLogger from "../../common/logger";

/**
 * 将 Agent Runtime 信息直接转换为 AgentConfig 格式
 */
export function convertAgentRuntimeToFunctionConfig(
  agentRuntime: AgentRuntimeInfo,
): FunctionConfig {
  const logger = GLogger.getLogger();
  logger.debug("Converting agent runtime to function config...");
  const agentConfig: FunctionConfig = {
    name: agentRuntime.agentRuntimeName,
  };

  if (agentRuntime.description) {
    agentConfig.description = agentRuntime.description;
  }

  if (agentRuntime.cpu) {
    agentConfig.cpu = agentRuntime.cpu;
  }
  if (agentRuntime.memory) {
    agentConfig.memory = agentRuntime.memory;
  }
  if (agentRuntime.diskSize) {
    agentConfig.diskSize = agentRuntime.diskSize;
  }
  if (agentRuntime.sessionConcurrencyLimitPerInstance) {
    agentConfig.instanceConcurrency =
      agentRuntime.sessionConcurrencyLimitPerInstance;
  }

  // 端口配置
  if (agentRuntime.port) {
    agentConfig.port = agentRuntime.port;
  }

  // 会话空闲超时
  if (agentRuntime.sessionIdleTimeoutSeconds) {
    agentConfig.sessionIdleTimeoutSeconds =
      agentRuntime.sessionIdleTimeoutSeconds;
  }
  if (agentRuntime.networkConfiguration) {
    const netConfig = agentRuntime.networkConfiguration;

    // 设置 internetAccess
    if (netConfig.networkMode === "PRIVATE") {
      agentConfig.internetAccess = false;
    } else {
      agentConfig.internetAccess = true;
    }

    if (netConfig.vpcId || netConfig.vswitchIds || netConfig.securityGroupId) {
      agentConfig.vpcConfig = {
        vpcId: netConfig.vpcId || "",
        vSwitchIds: netConfig.vswitchIds || [],
        securityGroupId: netConfig.securityGroupId || "",
      };
    }
  } else {
    // 默认允许公网访问
    agentConfig.internetAccess = true;
  }

  // 兼容旧的 vpcConfiguration 字段（如果存在）
  if (agentRuntime.vpcConfiguration && !agentConfig.vpcConfig) {
    agentConfig.vpcConfig = {
      vpcId: agentRuntime.vpcConfiguration.vpcId,
      vSwitchIds: agentRuntime.vpcConfiguration.vSwitchIds || [],
      securityGroupId: agentRuntime.vpcConfiguration.securityGroupId,
    };
  }

  // NAS 配置
  if (agentRuntime.nasConfiguration) {
    agentConfig.nasConfig = agentRuntime.nasConfiguration;
  } else if (agentRuntime.nasConfig) {
    agentConfig.nasConfig = agentRuntime.nasConfig;
  }

  // OSS 挂载配置
  if (agentRuntime.ossMountConfig) {
    agentConfig.ossMountConfig = agentRuntime.ossMountConfig;
  }

  // 环境变量
  if (agentRuntime.environmentVariables) {
    agentConfig.environmentVariables = agentRuntime.environmentVariables;
  }

  // 角色（支持多种字段名）
  if (agentRuntime.executionRoleArn) {
    agentConfig.role = agentRuntime.executionRoleArn;
  } else if (agentRuntime.roleArn) {
    agentConfig.role = agentRuntime.roleArn;
  } else if (agentRuntime.role) {
    agentConfig.role = agentRuntime.role;
  }

  // 凭证名称
  if (agentRuntime.credentialName) {
    agentConfig.credentialName = agentRuntime.credentialName;
  }

  // 日志配置
  if (agentRuntime.logConfiguration) {
    agentConfig.logConfig = {
      project: agentRuntime.logConfiguration.project,
      logstore: agentRuntime.logConfiguration.logstore,
    };
  }

  // 协议配置
  if (agentRuntime.protocolConfiguration) {
    agentConfig.protocolConfiguration = agentRuntime.protocolConfiguration;
  }

  // 健康检查配置
  if (agentRuntime.healthCheckConfiguration) {
    agentConfig.healthCheckConfiguration =
      agentRuntime.healthCheckConfiguration;
  }

  // 端点配置
  if (agentRuntime.endpoints) {
    agentConfig.endpoints = agentRuntime.endpoints;
  }

  // 自定义域名配置
  if (agentRuntime.customDomain) {
    agentConfig.customDomain = agentRuntime.customDomain;
  }

  // 工作空间配置
  if (agentRuntime.workspaceId) {
    agentConfig.workspace = {
      id: agentRuntime.workspaceId,
    };
  }

  // ARMS 配置
  if (agentRuntime.armsConfiguration) {
    agentConfig.armsConfiguration = agentRuntime.armsConfiguration;
  }

  // 代码配置或容器配置
  if (agentRuntime.containerConfiguration) {
    // 容器模式
    agentConfig.customContainerConfig = {
      image: agentRuntime.containerConfiguration.image,
    };

    // 标准化 command 字段，确保是数组格式
    let command = agentRuntime.containerConfiguration.command;
    if (command && !Array.isArray(command)) {
      command = [command];
    }
    if (command) {
      agentConfig.customContainerConfig.command = command;
    }

    if (agentRuntime.containerConfiguration.imageRegistryType) {
      agentConfig.customContainerConfig.imageRegistryType =
        agentRuntime.containerConfiguration.imageRegistryType;
    }
    if (agentRuntime.containerConfiguration.acrInstanceId) {
      agentConfig.customContainerConfig.acrInstanceId =
        agentRuntime.containerConfiguration.acrInstanceId;
    }
  } else if (agentRuntime.codeConfiguration) {
    // 代码模式
    agentConfig.code = {
      language: agentRuntime.codeConfiguration.language,
    };

    // OSS 配置
    if (
      agentRuntime.codeConfiguration.ossBucketName &&
      agentRuntime.codeConfiguration.ossObjectName
    ) {
      agentConfig.code.ossBucketName =
        agentRuntime.codeConfiguration.ossBucketName;
      agentConfig.code.ossObjectName =
        agentRuntime.codeConfiguration.ossObjectName;
    }

    // 命令配置
    if (agentRuntime.codeConfiguration.command) {
      agentConfig.code.command = agentRuntime.codeConfiguration.command;
    }
  }

  return agentConfig;
}

/**
 * 检测编程语言
 */
export function detectLanguage(runtime: string): string {
  const runtimeMap: { [key: string]: string } = {
    "python3.10": "python3.10",
    "python3.12": "python3.12",
    nodejs18: "nodejs18",
    nodejs20: "nodejs20",
    java8: "java8",
    java11: "java11",
    java17: "java17",
    "custom.debian10": "python3.10",
    "custom.debian11": "python3.12",
  };
  const detectedLanguage = runtimeMap[runtime] || "python3.10";
  return detectedLanguage;
}
