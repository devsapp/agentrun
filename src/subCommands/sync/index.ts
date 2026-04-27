import fs from "fs";
import _ from "lodash";
import yaml from "js-yaml";
import path from "path";
import { IInputs } from "../../interface";
import GLogger from "../../common/logger";
import { FunctionConfig } from "./types";
import { AgentRuntimeAPI } from "./agentRuntimeAPI";
import { convertAgentRuntimeToFunctionConfig } from "./configConverter";
import {
  downloadCodeFromOSS,
  downloadCodeFromURL,
  getFunctionName,
} from "./codeDownloader";
import {
  resolveWorkspaceId,
  getAgentRuntimeIdByWorkspace,
} from "../../utils/agentRuntimeQuery";
import { initAgentRunClient } from "../../utils/client";
import { FCClient } from "./fcClient";

export default class Sync {
  private target: string;
  private region: string;
  private agentName: string;
  private workspaceId?: string;
  private workspaceName?: string;
  private qualifier: string;
  private disableListRemoteEbTriggers?: string;
  private disableListRemoteAlbTriggers?: string;
  private inputs: IInputs;

  constructor(inputs: IInputs) {
    const {
      "target-dir": target,
      "agent-name": agentName,
      region,
      "workspace-id": workspaceId,
      "workspace-name": workspaceName,
      qualifier,
      "disable-list-remote-eb-triggers": disableListRemoteEbTriggers,
      "disable-list-remote-alb-triggers": disableListRemoteAlbTriggers,
    } = require("@serverless-devs/utils").parseArgv(inputs.args, {
      string: [
        "target-dir",
        "agent-name",
        "region",
        "workspace-id",
        "workspace-name",
        "qualifier",
        "disable-list-remote-eb-triggers",
        "disable-list-remote-alb-triggers",
      ],
      alias: { "assume-yes": "y" },
    });

    if (target && fs.existsSync(target) && !fs.statSync(target).isDirectory()) {
      throw new Error(
        `--target-dir "${target}" exists, but is not a directory`,
      );
    }

    this.target = target;
    this.region = region;
    this.agentName = agentName;
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.qualifier = qualifier || "LATEST";
    this.disableListRemoteEbTriggers = disableListRemoteEbTriggers;
    this.disableListRemoteAlbTriggers = disableListRemoteAlbTriggers;
    this.inputs = inputs;

    if (!this.agentName) {
      throw new Error("Missing required argument: --agent-name");
    }

    if (!this.region) {
      throw new Error("Missing required argument: --region");
    }
  }

  async run() {
    const logger = GLogger.getLogger();
    logger.debug("Starting sync process");

    try {
      const agentRuntimeAPI = new AgentRuntimeAPI(this.inputs, this.region);
      const client = await initAgentRunClient(this.inputs, this.region, "sync");
      const resolvedWorkspaceId = await resolveWorkspaceId(
        client,
        this.inputs,
        this.workspaceId,
        this.workspaceName,
      );
      const runtimeId = await getAgentRuntimeIdByWorkspace(
        client,
        this.agentName,
        resolvedWorkspaceId,
      );
      if (!runtimeId) {
        throw new Error(`Agent runtime "${this.agentName}" not found`);
      }
      const agentRuntimeInfo =
        await agentRuntimeAPI.getCompleteAgentRuntimeInfo(runtimeId);
      const functionName = getFunctionName(runtimeId);
      const functionConfig =
        convertAgentRuntimeToFunctionConfig(agentRuntimeInfo);

      // 初始化 FC 客户端以获取 FC 相关配置
      const credentials = await this.inputs.getCredential();
      const fcClient = new FCClient(this.region, credentials);

      // 获取触发器列表
      logger.info("Fetching triggers...");
      const triggersList = await fcClient.listTriggers(
        functionName,
        this.disableListRemoteEbTriggers,
        this.disableListRemoteAlbTriggers,
      );

      // 获取异步调用配置
      const asyncInvokeConfig = await fcClient.getAsyncInvokeConfig(
        functionName,
        this.qualifier,
      );

      // 获取预留配置
      const provisionConfig = await fcClient.getFunctionProvisionConfig(
        functionName,
        this.qualifier,
      );

      // 获取弹性伸缩配置
      const scalingConfig = await fcClient.getFunctionScalingConfig(
        functionName,
        this.qualifier,
      );

      // 获取并发配置
      const concurrencyConfig =
        await fcClient.getFunctionConcurrency(functionName);

      // 获取 VPC 绑定配置
      const vpcBindingConfig = await fcClient.getVpcBinding(functionName);

      return await this.write(
        functionName,
        functionConfig,
        triggersList,
        asyncInvokeConfig,
        concurrencyConfig,
        provisionConfig,
        scalingConfig,
        vpcBindingConfig,
      );
    } catch (error: any) {
      logger.error(`Sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入 YAML 和代码文件
   */
  async write(
    functionName: string,
    functionConfig: FunctionConfig,
    triggersList: any,
    asyncInvokeConfig: any,
    concurrencyConfig: any,
    provisionConfig: any,
    scalingConfig: any,
    vpcBindingConfig: any,
  ) {
    const logger = GLogger.getLogger();
    const syncFolderName = "sync-clone";
    const baseDir = this.target
      ? this.target
      : path.join(this.inputs.baseDir || process.cwd(), syncFolderName);
    logger.debug(`sync base dir: ${baseDir}`);

    const codePath = path
      .join(baseDir, `${this.region}_${this.agentName}`)
      .replace("$", "_");
    logger.debug(`sync code path: ${codePath}`);

    const ymlPath = path
      .join(baseDir, `${this.region}_${this.agentName}.yaml`)
      .replace("$", "_");
    logger.debug(`sync yaml path: ${ymlPath}`);

    const isCustomContainer = !!functionConfig.customContainerConfig;

    if (!isCustomContainer) {
      logger.info("Downloading function code...");
      let codeDownloaded = false;

      if (
        functionConfig.code?.ossBucketName &&
        functionConfig.code?.ossObjectName
      ) {
        try {
          await downloadCodeFromOSS(
            functionConfig.code.ossBucketName,
            functionConfig.code.ossObjectName,
            this.region,
            codePath,
            baseDir,
          );
          functionConfig.code.src = codePath;
          delete functionConfig.code.ossBucketName;
          delete functionConfig.code.ossObjectName;
          codeDownloaded = true;
        } catch (error: any) {
          logger.warn(
            `Failed to download from OSS: ${error.message}. Trying FC API...`,
          );
        }
      }

      if (!codeDownloaded) {
        try {
          const credentials = await this.inputs.getCredential();
          const fcClient = new FCClient(this.region, credentials);
          const { url: codeUrl } = await fcClient.getFunctionCode(
            functionName,
            this.qualifier,
          );

          await downloadCodeFromURL(codeUrl, this.region, codePath);
          functionConfig.code.src = codePath;
          codeDownloaded = true;
        } catch (error: any) {
          logger.error(`Failed to download code: ${error.message}`);
        }
      }

      if (!codeDownloaded) {
        logger.warn(
          "Code was not downloaded. Please check the agent runtime configuration.",
        );
      }
    }

    if (functionConfig.role) {
      functionConfig.role = functionConfig.role.toLowerCase();
    }

    // 清理不需要的字段
    _.unset(functionConfig, "lastUpdateStatus");
    _.unset(functionConfig, "state");
    _.unset(functionConfig, "createdTime");
    _.unset(functionConfig, "lastModifiedTime");
    if (functionConfig.customContainerConfig) {
      _.unset(functionConfig.customContainerConfig, "resolvedImageUri");
    }

    const agentConfig = { ...functionConfig };

    // 触发器（放在 agent 配置外层）
    let triggersData: any = undefined;
    if (!_.isEmpty(triggersList)) {
      triggersData = triggersList;
    }

    // 构建 agentrun 格式的 YAML 配置
    const config: any = {
      edition: "3.0.0",
      name: this.inputs.name,
      access: this.inputs.resource.access,
      resources: {
        [this.agentName]: {
          component: "agentrun",
          props: {
            region: this.region,
            agent: agentConfig,
          },
        },
      },
    };

    // 添加触发器到 props 层级（如果需要）
    if (triggersData) {
      config.resources[this.agentName].props.triggers = triggersData;
    }

    // 添加异步调用配置
    if (!_.isEmpty(asyncInvokeConfig)) {
      config.resources[this.agentName].props.asyncInvokeConfig =
        asyncInvokeConfig;
    }

    // 添加预留/弹性配置
    if (!_.isEmpty(provisionConfig)) {
      config.resources[this.agentName].props.provisionConfig = provisionConfig;
    } else if (!_.isEmpty(scalingConfig)) {
      config.resources[this.agentName].props.scalingConfig = scalingConfig;
    }

    // 添加并发配置
    if (!_.isEmpty(concurrencyConfig)) {
      config.resources[this.agentName].props.concurrencyConfig =
        concurrencyConfig;
    }

    // 添加 VPC 绑定配置
    if (!_.isEmpty(vpcBindingConfig)) {
      config.resources[this.agentName].props.vpcBinding = vpcBindingConfig;
    }

    logger.debug(`yaml config: ${JSON.stringify(config)}`);

    const configStr = yaml.dump(config);
    logger.debug(`yaml config str: ${configStr}`);

    // 创建目录并写入文件
    fs.mkdirSync(baseDir, { recursive: true });
    logger.debug(`mkdir: ${baseDir}`);
    fs.writeFileSync(ymlPath, configStr);
    logger.debug(`write file: ${ymlPath}`);

    logger.info(`Sync completed successfully!`);
    logger.info(`YAML file: ${ymlPath}`);
    if (codePath && fs.existsSync(codePath)) {
      logger.info(`Code directory: ${codePath}`);
    }

    return { ymlPath, codePath };
  }
}
