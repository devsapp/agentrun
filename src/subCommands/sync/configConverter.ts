import _ from "lodash";
import { AgentRuntimeInfo, FunctionConfig } from "./types";

/**
 * 将 Agent Runtime 信息转换为 FC 函数配置格式
 */
export function convertAgentRuntimeToFunctionConfig(
  agentRuntime: AgentRuntimeInfo,
): FunctionConfig {
  // 确定运行时类型
  let runtime: string;
  if (agentRuntime.containerConfiguration) {
    // 容器模式
    runtime = "custom-container";
  } else {
    // 代码模式
    runtime = convertLanguageToRuntime(
      agentRuntime.codeConfiguration?.language,
    );
  }

  const functionConfig: FunctionConfig = {
    runtime: runtime,
    cpu: agentRuntime.cpu,
    memorySize: agentRuntime.memory,
    diskSize: agentRuntime.diskSize || 512, // 默认磁盘大小
    description: agentRuntime.description || "",
    instanceConcurrency: agentRuntime.sessionConcurrencyLimitPerInstance,
  };

  // 端口配置
  if (agentRuntime.port) {
    functionConfig.customRuntimeConfig = {
      port: agentRuntime.port,
    };
  }

  // 环境变量
  if (agentRuntime.environmentVariables) {
    functionConfig.environmentVariables = agentRuntime.environmentVariables;
  }

  // 日志配置
  if (agentRuntime.logConfiguration) {
    functionConfig.logConfig = {
      project: agentRuntime.logConfiguration.project,
      logstore: agentRuntime.logConfiguration.logstore,
    };
  }

  // 网络配置
  if (agentRuntime.networkConfiguration?.networkMode === "VPC") {
    functionConfig.internetAccess = false;
  } else {
    functionConfig.internetAccess = true;
  }

  // 代码配置（从 OSS 信息构建）
  if (
    agentRuntime.codeConfiguration?.ossBucketName &&
    agentRuntime.codeConfiguration?.ossObjectName
  ) {
    functionConfig.code = {
      ossBucketName: agentRuntime.codeConfiguration.ossBucketName,
      ossObjectName: agentRuntime.codeConfiguration.ossObjectName,
    };
  }

  // 命令配置
  if (agentRuntime.codeConfiguration?.command) {
    if (!functionConfig.customRuntimeConfig) {
      functionConfig.customRuntimeConfig = {};
    }
    functionConfig.customRuntimeConfig.command =
      agentRuntime.codeConfiguration.command;
  }

  // VPC 配置
  if (agentRuntime.vpcConfiguration) {
    functionConfig.vpcConfig = {
      vpcId: agentRuntime.vpcConfiguration.vpcId,
      vSwitchIds: agentRuntime.vpcConfiguration.vSwitchIds || [],
      securityGroupId: agentRuntime.vpcConfiguration.securityGroupId,
    };
  }

  // 角色
  if (agentRuntime.roleArn) {
    // 提取角色名称（移除ARN前缀）
    const roleMatch = agentRuntime.roleArn.match(/role\/(.+)$/);
    if (roleMatch) {
      functionConfig.role = roleMatch[1].toLowerCase();
    }
  }

  // 协议配置
  if (agentRuntime.protocolConfiguration) {
    functionConfig.protocolConfiguration = agentRuntime.protocolConfiguration;
  }

  // 健康检查配置
  if (agentRuntime.healthCheckConfiguration) {
    functionConfig.healthCheckConfiguration =
      agentRuntime.healthCheckConfiguration;
  }

  // NAS 配置
  if (agentRuntime.nasConfiguration) {
    functionConfig.nasConfig = agentRuntime.nasConfiguration;
  }

  // 容器配置（镜像导出）
  if (agentRuntime.containerConfiguration) {
    // 标准化 command 字段，确保是数组格式
    let command = agentRuntime.containerConfiguration.command;
    if (command && !Array.isArray(command)) {
      command = [command];
    }

    functionConfig.customContainerConfig = {
      image: agentRuntime.containerConfiguration.image,
      command: command,
      imageRegistryType: agentRuntime.containerConfiguration.imageRegistryType,
      acrInstanceId: agentRuntime.containerConfiguration.acrInstanceId,
    };
  }

  return functionConfig;
}

/**
 * 将 Agent Runtime 语言转换为 FC 运行时
 */
function convertLanguageToRuntime(language: string): string {
  const languageMap: { [key: string]: string } = {
    "python3.10": "python3.10",
    "python3.12": "python3.12",
    nodejs18: "nodejs18",
    nodejs20: "nodejs20",
    java8: "java8",
    java11: "java11",
    java17: "java17",
  };
  return languageMap[language] || "python3.10";
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
    "custom.debian10": "python3.10", // 默认映射
    "custom.debian11": "python3.12", // 默认映射
  };
  const detectedLanguage = runtimeMap[runtime] || "python3.10";
  return detectedLanguage;
}
