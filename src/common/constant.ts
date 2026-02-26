import path from "path";

// AgentRun service endpoints
// AgentRun uses standard Alibaba Cloud endpoint format: agentrun.{region}.aliyuncs.com
export const agentRunRegionEndpoints: Map<string, string> = new Map([
  ["cn-beijing", "agentrun.cn-beijing.aliyuncs.com"],
  ["cn-hangzhou", "agentrun-pre.cn-hangzhou.aliyuncs.com"],
  ["cn-shanghai", "agentrun.cn-shanghai.aliyuncs.com"],
  ["cn-zhangjiakou", "agentrun.cn-zhangjiakou.aliyuncs.com"],
  ["cn-shenzhen", "agentrun.cn-shenzhen.aliyuncs.com"],
  ["cn-guangzhou", "agentrun.cn-guangzhou.aliyuncs.com"],
  ["cn-hongkong", "agentrun.cn-hongkong.aliyuncs.com"],
  ["ap-southeast-1", "agentrun.ap-southeast-1.aliyuncs.com"],
  ["eu-west-1", "agentrun.eu-west-1.aliyuncs.com"],
]);

export const SCHEMA_FILE_PATH = path.resolve(__dirname, "./schema.json");
export const SCHEMA_FILE_PATH_DELETE = path.resolve(
  __dirname,
  "./schema-delete.json",
);
