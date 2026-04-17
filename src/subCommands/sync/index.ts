import fs from "fs";
import fs_extra from "fs-extra";
import _ from "lodash";
import yaml from "js-yaml";
import path from "path";
import { IInputs } from "../../interface";
import GLogger from "../../common/logger";
import chalk from "chalk";
import { SyncOptions, FunctionConfig } from "./types";
import { AgentRuntimeAPI } from "./agentRuntimeAPI";
import {
  convertAgentRuntimeToFunctionConfig,
  detectLanguage,
} from "./configConverter";
import { downloadCodeFromOSS, getFunctionName } from "./codeDownloader";

// 移除顶部的 logger 获取
// const logger = GLogger.getLogger();

export default class Sync {
  private target: string;
  private region: string;
  private agentName: string;
  private inputs: IInputs;

  constructor(inputs: IInputs) {
    // 在构造函数中获取 logger
    const logger = GLogger.getLogger();

    logger.info("=== DEBUG: Starting Sync constructor ===");
    logger.info(`DEBUG: inputs.args = ${JSON.stringify(inputs.args)}`);
    logger.info(`DEBUG: inputs.props = ${JSON.stringify(inputs.props)}`);

    const {
      "target-dir": target,
      "agent-name": agentName,
      region,
    } = require("@serverless-devs/utils").parseArgv(inputs.args, {
      string: ["target-dir", "agent-name", "region"],
      alias: { "assume-yes": "y" },
    });

    logger.info(
      `DEBUG: parsed args - target: ${target}, agentName: ${agentName}, region: ${region}`,
    );

    if (target && fs.existsSync(target) && !fs.statSync(target).isDirectory()) {
      throw new Error(
        `--target-dir "${target}" exists, but is not a directory`,
      );
    }

    this.target = target;
    this.region = region;
    this.agentName = agentName;

    logger.info(`DEBUG: this.target = ${this.target}`);
    logger.info(`DEBUG: this.region = ${this.region}`);
    logger.info(`DEBUG: this.agentName = ${this.agentName}`);

    if (!this.agentName) {
      logger.error("DEBUG: Agent name not specified!");
      throw new Error("Agent name not specified, please specify --agent-name");
    }

    if (!this.region) {
      logger.error("DEBUG: Region not specified!");
      throw new Error("Region not specified, please specify --region");
    }

    logger.info("=== DEBUG: Sync constructor completed ===");

    this.inputs = inputs;
  }

  async run() {
    const logger = GLogger.getLogger();
    logger.info("=== DEBUG: run method called ===");
    logger.info(
      chalk.yellow(`\n🔄 Starting sync for agent: ${this.agentName}`),
    );

    const agentRuntimeAPI = new AgentRuntimeAPI(this.inputs, this.region);

    // logger.info("agentrun API initialized successfully.", agentRuntimeAPI);

    // 获取 Agent Runtime ID
    logger.info("DEBUG: Getting agent runtime ID...");
    const runtimeId = await agentRuntimeAPI.getAgentRuntimeId(this.agentName);
    logger.info(`DEBUG: Agent Runtime ID: ${runtimeId}`);

    logger.info("DEBUG: Getting complete agent runtime information...");
    const agentRuntimeInfo =
      await agentRuntimeAPI.getCompleteAgentRuntimeInfo(runtimeId);

    // logger.info("getCompleteAgentRuntime", agentRuntimeInfo);

    // 构造函数名
    const functionName = getFunctionName(runtimeId);
    logger.info(`DEBUG: Function Name: ${functionName}`);

    // 转换配置
    const functionInfo = convertAgentRuntimeToFunctionConfig(agentRuntimeInfo);

    // 触发器等信息暂时留空
    const triggers: any[] = [];
    const asyncInvokeConfig = {};
    const concurrencyConfig = {};
    const provisionConfig = {};
    const scalingConfig = {};

    // 写入文件和代码
    logger.info("DEBUG: Writing files and code...");
    return await this.write(
      functionName,
      functionInfo,
      triggers,
      asyncInvokeConfig,
      concurrencyConfig,
      provisionConfig,
      scalingConfig,
    );
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
  ) {
    const logger = GLogger.getLogger();
    logger.info("=== DEBUG: write method called ===");
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

    // 下载函数代码（如果配置中有 OSS 信息）
    if (
      functionConfig.code?.ossBucketName &&
      functionConfig.code?.ossObjectName
    ) {
      await downloadCodeFromOSS(
        functionConfig.code.ossBucketName,
        functionConfig.code.ossObjectName,
        this.region,
        codePath,
        baseDir,
      );
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      functionConfig.code = codePath;
    } else if (functionConfig.runtime !== "custom-container") {
      logger.info("No OSS code configuration found, skipping code download");
    } else {
      logger.info("Custom container runtime, skipping code download");
    }

    // 处理 role（转为小写）
    if (functionConfig.role) {
      const role = functionConfig.role as string;
      // eslint-disable-next-line no-param-reassign
      functionConfig.role = role.toLowerCase();
    }

    // 清理不需要的字段
    _.unset(functionConfig, "lastUpdateStatus");
    _.unset(functionConfig, "state");

    // 将 FC 函数配置转换为 agentrun 配置格式
    const agentConfig: any = {
      name: this.agentName,
    };

    // 基本信息
    if (functionConfig.description) {
      agentConfig.description = functionConfig.description;
    }

    // 资源配置
    if (functionConfig.cpu) {
      agentConfig.cpu = functionConfig.cpu;
    }
    if (functionConfig.memorySize) {
      agentConfig.memory = functionConfig.memorySize;
    }
    if (functionConfig.diskSize) {
      agentConfig.diskSize = functionConfig.diskSize;
    }
    if (functionConfig.instanceConcurrency) {
      agentConfig.instanceConcurrency = functionConfig.instanceConcurrency;
    }

    // 端口配置
    if (functionConfig.customRuntimeConfig?.port) {
      agentConfig.port = functionConfig.customRuntimeConfig.port;
    }

    // 代码配置或容器配置
    if (functionConfig.runtime === "custom-container") {
      // 容器模式
      if (functionConfig.customContainerConfig) {
        agentConfig.customContainerConfig = {
          image: functionConfig.customContainerConfig.image,
        };
        if (functionConfig.customContainerConfig.command) {
          agentConfig.customContainerConfig.command =
            functionConfig.customContainerConfig.command;
        }
        if (functionConfig.customContainerConfig.imageRegistryType) {
          agentConfig.customContainerConfig.imageRegistryType =
            functionConfig.customContainerConfig.imageRegistryType;
        }
        if (functionConfig.customContainerConfig.acrInstanceId) {
          agentConfig.customContainerConfig.acrInstanceId =
            functionConfig.customContainerConfig.acrInstanceId;
        }
      }
    } else {
      // 代码模式
      agentConfig.code = {
        language: detectLanguage(functionConfig.runtime),
      };

      // 如果有本地代码路径，使用它
      if (functionConfig.code && typeof functionConfig.code === "string") {
        agentConfig.code.src = functionConfig.code;
      }

      // 命令配置
      if (functionConfig.customRuntimeConfig?.command) {
        agentConfig.code.command = functionConfig.customRuntimeConfig.command;
      }
    }
    if (functionConfig.vpcConfig) {
      agentConfig.vpcConfig = {
        vpcId: functionConfig.vpcConfig.vpcId,
        vSwitchIds: functionConfig.vpcConfig.vSwitchIds,
        securityGroupId: functionConfig.vpcConfig.securityGroupId,
      };
    }
    // 兼容 FC3 的 vpcBinding 配置（如果存在）
    else if (
      functionConfig.vpcBinding &&
      functionConfig.vpcBinding.vpcIds &&
      functionConfig.vpcBinding.vpcIds.length > 0
    ) {
      agentConfig.vpcConfig = {
        vpcId: functionConfig.vpcBinding.vpcId,
        vSwitchIds: functionConfig.vpcBinding.vSwitchIds,
        securityGroupId: functionConfig.vpcBinding.securityGroupId,
      };
    }

    // 网络访问
    if (functionConfig.internetAccess !== undefined) {
      agentConfig.internetAccess = functionConfig.internetAccess;
    }

    // NAS 配置
    if (functionConfig.nasConfig) {
      agentConfig.nasConfig = functionConfig.nasConfig;
    }

    // 环境变量
    if (functionConfig.environmentVariables) {
      agentConfig.environmentVariables = functionConfig.environmentVariables;
    }

    // 角色
    if (functionConfig.role) {
      agentConfig.role = functionConfig.role;
    }

    // 日志配置
    if (functionConfig.logConfig) {
      agentConfig.logConfig = {
        project: functionConfig.logConfig.project,
        logstore: functionConfig.logConfig.logstore,
      };
    }

    // 协议配置
    if (functionConfig.protocolConfiguration) {
      agentConfig.protocolConfiguration = functionConfig.protocolConfiguration;
    }

    // 健康检查配置
    if (functionConfig.healthCheckConfiguration) {
      agentConfig.healthCheckConfiguration =
        functionConfig.healthCheckConfiguration;
    }

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

    logger.debug(`yaml config: ${JSON.stringify(config)}`);

    const configStr = yaml.dump(config);
    logger.debug(`yaml config str: ${configStr}`);

    // 创建目录并写入文件
    fs.mkdirSync(baseDir, { recursive: true });
    logger.debug(`mkdir: ${baseDir}`);
    fs.writeFileSync(ymlPath, configStr);
    logger.debug(`write file: ${ymlPath}`);

    logger.info(chalk.green(`\n✅ Sync completed successfully!`));
    logger.info(chalk.cyan(`YAML file: ${ymlPath}`));
    if (
      functionConfig.runtime !== "custom-container" &&
      typeof functionConfig.code === "string"
    ) {
      logger.info(chalk.cyan(`Code directory: ${codePath}`));
    }

    return { ymlPath, codePath };
  }
}
