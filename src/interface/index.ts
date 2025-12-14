import { IInputs as _IInputs } from "@serverless-devs/component-interface";

export interface IInputs extends _IInputs {
  baseDir: string;
  userAgent?: string;

  props: {
    region: string;

    // 智能体配置（新规范）
    agent: AgentConfig;

    // 其他资源配置（用于未来扩展）
    credentials?: CredentialConfig[];
    models?: ModelConfig[];
    sandboxes?: SandboxConfig[];
    memories?: MemoryConfig[];
    tools?: ToolConfig[];
  };
}

// ============= 智能体配置 =============
export interface AgentConfig {
  // 基本信息
  name: string;
  description?: string;

  // 代码配置（配置此字段表示使用代码模式）
  code?: CodeConfig;

  // 容器配置（配置此字段表示使用容器模式）
  customContainerConfig?: CustomContainerConfig;

  // 资源配置
  cpu?: number; // CPU 核数，默认 1.0
  memory?: number; // 内存 MB，默认 2048

  // 端口和并发
  port?: number; // 端口号，默认 8000
  instanceConcurrency?: number; // 实例并发数，默认 10

  // 会话配置
  sessionIdleTimeoutSeconds?: number; // 会话空闲超时（秒），默认 3600

  // 网络配置
  vpcConfig?: VpcConfig; // VPC 配置
  internetAccess?: boolean; // 是否允许公网访问

  // 环境变量
  environmentVariables?: { [key: string]: string };

  // 执行角色和凭证
  role?: string; // RAM 角色 ARN
  credentialName?: string; // 访问凭证名称

  // 日志配置
  logConfig?: LogConfig;

  // 协议配置
  protocolConfiguration?: ProtocolConfig;

  // 健康检查配置
  healthCheckConfiguration?: HealthCheckConfig;

  // 端点配置
  endpoints?: EndpointConfig[];
}

// 代码配置（必须是对象，包含 src 或 OSS 配置）
export interface CodeConfig {
  // 本地代码路径（目录或 zip 文件）
  src?: string;

  // OSS 配置
  ossBucketName?: string;
  ossObjectName?: string;

  // 编程语言（必填）
  language:
    | "python3.10"
    | "python3.12"
    | "nodejs18"
    | "nodejs20"
    | "java8"
    | "java11"
    | "custom";

  // 运行命令（可选）
  command?: string[];

  // CRC-64 校验值（可选）
  checksum?: string;
}

// 容器配置
export interface CustomContainerConfig {
  image: string;
  command?: string[];
  imageRegistryType?: "ACR" | "ACREE" | "CUSTOM"; // 镜像源类型
  acrInstanceId?: string; // ACR 实例 ID
}

// VPC 配置
export interface VpcConfig {
  vpcId: string;
  vSwitchIds: string | string[]; // 支持单个或多个交换机
  securityGroupId: string;
}

// 日志配置
export interface LogConfig {
  project: string; // SLS 项目名称
  logstore: string; // SLS 日志库名称
}

// 协议配置
export interface ProtocolConfig {
  type: "HTTP" | "HTTPS"; // 协议类型
}

// 健康检查配置
export interface HealthCheckConfig {
  httpGetUrl?: string; // HTTP GET URL，默认 /health
  initialDelaySeconds?: number; // 初始延迟（秒），默认 30
  periodSeconds?: number; // 检查间隔（秒），默认 30
  timeoutSeconds?: number; // 超时时间（秒），默认 3
  failureThreshold?: number; // 失败阈值，默认 3
  successThreshold?: number; // 成功阈值，默认 1
}

// 端点配置
export interface EndpointConfig {
  name: string;
  version?: number | string; // 支持数字或 "LATEST"
  description?: string;
  weight?: number; // 灰度流量权重 (0.0-1.0)
}

// ============= 凭证配置 =============
export interface CredentialConfig {
  name: string;
  type: "api_key" | "jwt" | "basic" | "ak_sk" | "custom_header";
  description?: string;
  secret: string;
  config?: { [key: string]: any };
}

// ============= 模型配置 =============
export interface ModelConfig {
  name: string;
  type: "chat" | "embedding" | "image" | "proxy";
  provider?: string;
  modelId?: string;
  endpoint?: string;
  apiKey?: string;
  description?: string;
  mode?: "failover" | "load_balance" | "round_robin";
  backends?: ModelBackend[];
}

export interface ModelBackend {
  provider: string;
  endpoint: string;
  apiKey: string;
  modelName: string;
  weight?: number;
}

// ============= 沙箱配置 =============
export interface SandboxConfig {
  name: string;
  type: "Browser" | "CodeInterpreter";
  cpu?: number;
  memory?: number;
  image?: string;
  recording?: RecordingConfig;
}

export interface RecordingConfig {
  enabled: boolean;
  bucket?: string;
  prefix?: string;
}

// ============= 记忆配置 =============
export interface MemoryConfig {
  name: string;
  shortTtl?: number; // 短期记忆保留天数
  longTtl?: number; // 长期记忆保留天数
  strategy?: string[];
}

// ============= 工具配置 =============
export interface ToolConfig {
  name: string;
  type: "function_call" | "mcp";
  description?: string;
  schema?: string;
  sourceType?: "custom" | "template" | "schema";
}

// ============= 内部使用的配置（用于 SDK 调用）=============
// 这个接口用于内部转换，不对外暴露在 YAML 中
export interface AgentRuntimeConfig {
  agentRuntimeName: string;
  description?: string;
  artifactType: "Code" | "Container";
  codeConfiguration?: CodeConfiguration;
  containerConfiguration?: ContainerConfiguration;
  cpu?: number;
  memory?: number;
  port?: number;
  sessionConcurrencyLimitPerInstance?: number;
  sessionIdleTimeoutSeconds?: number;
  networkConfiguration?: NetworkConfiguration;
  environmentVariables?: { [key: string]: string };
  executionRoleArn?: string;
  credentialName?: string;
  logConfiguration?: LogConfiguration;
  protocolConfiguration?: ProtocolConfiguration;
  healthCheckConfiguration?: HealthCheckConfiguration;
  endpoints?: EndpointConfigInternal[];
}

export interface CodeConfiguration {
  zipFile?: string;
  ossBucketName?: string;
  ossObjectName?: string;
  language?: string;
  command?: string[];
  checksum?: string;
}

export interface ContainerConfiguration {
  image: string;
  command?: string[];
  imageRegistryType?: "ACR" | "ACREE" | "CUSTOM";
  acrInstanceId?: string;
}

export interface NetworkConfiguration {
  networkMode: "PUBLIC" | "PRIVATE" | "PUBLIC_AND_PRIVATE";
  vpcId?: string;
  vswitchIds?: string[]; // ✅ 改为复数数组
  securityGroupId?: string;
}

export interface LogConfiguration {
  project: string;
  logstore: string;
}

export interface ProtocolConfiguration {
  type: "HTTP" | "HTTPS";
}

export interface HealthCheckConfiguration {
  httpGetUrl?: string;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
  successThreshold?: number;
}

export interface EndpointConfigInternal {
  endpointName: string;
  targetVersion?: string | number;
  description?: string;
  grayTrafficWeight?: GrayTrafficWeight;
}

export interface GrayTrafficWeight {
  version: string | number;
  weight: number;
}