import { IInputs } from "../../interface";

export interface SyncOptions {
  target?: string;
  region: string;
  agentName: string;
  inputs: IInputs;
}

export interface AgentRuntimeInfo {
  agentRuntimeId: string;
  agentRuntimeName: string;
  workspaceId?: string;
  [key: string]: any;
}

export interface FunctionConfig {
  runtime: string;
  cpu: number;
  memorySize: number;
  diskSize?: number;
  description?: string;
  instanceConcurrency?: number;
  customRuntimeConfig?: {
    port?: number;
    command?: string[];
  };
  environmentVariables?: Record<string, string>;
  logConfig?: {
    project: string;
    logstore: string;
  };
  internetAccess?: boolean;
  code?: {
    ossBucketName?: string;
    ossObjectName?: string;
    src?: string;
  };
  vpcConfig?: {
    vpcId: string;
    vSwitchIds: string[];
    securityGroupId: string;
  };
  role?: string;
  protocolConfiguration?: any;
  healthCheckConfiguration?: any;
  nasConfig?: any;
  vpcBinding?: any;
  customContainerConfig?: {
    image: string;
    command?: string[];
    imageRegistryType?: "ACR" | "ACREE" | "CUSTOM";
    acrInstanceId?: string;
  };
}
