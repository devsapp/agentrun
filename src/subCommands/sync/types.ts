import { IInputs } from "../../interface";
import { AgentConfig } from "../../interface";

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

export type FunctionConfig = AgentConfig;
