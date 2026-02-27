import { IInputs, AgentRuntimeConfig } from "../interface/index";
import {
  deployCustomDomain,
  removeCustomDomain,
  infoCustomDomain,
} from "./custom_domain";
import * as $OpenApi from "@alicloud/openapi-client";
import { parseArgv, getRootHome } from "@serverless-devs/utils";
import * as _ from "lodash";
import GLogger from "../common/logger";
import path from "path";
import chalk from "chalk";
import Client, {
  CreateAgentRuntimeRequest,
  CreateAgentRuntimeInput,
  CreateAgentRuntimeEndpointRequest,
  CreateAgentRuntimeEndpointInput,
  UpdateAgentRuntimeRequest,
  UpdateAgentRuntimeInput,
  UpdateAgentRuntimeEndpointRequest,
  UpdateAgentRuntimeEndpointInput,
  CodeConfiguration,
  ContainerConfiguration,
  NetworkConfiguration,
  LogConfiguration,
  ProtocolConfiguration,
  HealthCheckConfiguration,
  RoutingConfiguration,
  VersionWeight,
  ListAgentRuntimesRequest,
  GetAgentRuntimeRequest,
  ListAgentRuntimeEndpointsRequest,
} from "@alicloud/agentrun20250910";
import { agentRunRegionEndpoints } from "../common/constant";
import { verify, verifyDelete } from "../utils/verify";
import { AgentRuntimeOutput } from "./output";
import { promptForConfirmOrDetails } from "../utils/inquire";
import { sleep } from "@alicloud/tea-typescript";

// 新增导入
import FC2 from "@alicloud/fc2";
import OSS from "ali-oss";
import axios from "axios";
import fs from "fs";
import zip from "@serverless-devs/zip";
import Sls from "./sls";

// 常量定义
const FC_CLIENT_READ_TIMEOUT = 60000;

/**
 * 创建 FC2 客户端（用于获取临时 OSS Token）
 */
const createFC2Client = (
  region: string,
  credentials: any,
  customEndpoint?: string,
): FC2 => {
  let endpoint = customEndpoint;
  if (!endpoint) {
    endpoint = `https://${credentials.AccountID}.${region}.fc.aliyuncs.com`;
  }

  // ✅ 添加 https agent 配置
  const https = require("https");
  const httpsAgent = new https.Agent({
    rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    keepAlive: true,
  });

  return new FC2(credentials.AccountID, {
    accessKeyID: credentials.AccessKeyID,
    accessKeySecret: credentials.AccessKeySecret,
    securityToken: credentials.SecurityToken,
    region,
    endpoint,
    secure: true,
    timeout: FC_CLIENT_READ_TIMEOUT,
    httpsAgent,
  });
};

/**
 * 获取文件大小并显示
 */
function getFileSize(filePath: string): void {
  const logger = GLogger.getLogger();
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  logger.info(`Code package size: ${sizeInMB} MB`);

  if (stats.size > 50 * 1024 * 1024) {
    logger.warn("Code package is larger than 50MB, upload may take some time");
  }
}

export class AgentRun {
  baseDir: string;
  region: string;
  opts: any;
  agentRuntimeConfig: AgentRuntimeConfig;
  agentRuntimeId: string;
  agentRuntimeClient: Client;
  assumeYes: boolean = false;
  autolog: boolean = false;
  private fc2Client?: FC2;
  private accountId?: string; // 缓存 AccountID，用于 role ARN 转换

  constructor(
    readonly inputs: IInputs,
    action: string,
  ) {
    const opts = parseArgv(inputs.args, {
      alias: { help: "h", "assume-yes": "y" },
      boolean: ["help", "y"],
      string: [""],
    });
    if (action == "remove") {
      verifyDelete(inputs);
    } else {
      verify(inputs);
    }
    this.opts = opts;
    this.region = this.inputs.props.region;
    if (inputs.yaml?.path) {
      this.baseDir = path.dirname(inputs.yaml?.path);
    } else {
      this.baseDir = process.cwd();
    }

    const agentConfig = this.inputs.props.agent;
    if (!agentConfig) {
      throw new Error("agent configuration is required");
    }

    if (action === "remove") {
      this.agentRuntimeConfig = {
        agentRuntimeName: agentConfig.name,
      } as AgentRuntimeConfig;
    } else {
      this.agentRuntimeConfig = this.normalizeAgentConfig(agentConfig);
    }
    this.assumeYes = this.opts.y;

    GLogger.getLogger().debug(
      "construct finished, properties: %j",
      this.inputs.props,
    );
  }

  /**
   * 规范化角色 ARN（延迟执行版本）
   * 只在真正需要时才调用，避免影响代码上传流程
   */
  private async normalizeRoleArn(role?: string): Promise<string | undefined> {
    if (!role) {
      return undefined;
    }

    // 如果已经是完整的 ARN 格式，直接返回
    if (role.startsWith("acs:ram::")) {
      return role;
    }

    // 如果是简化格式，转换为完整 ARN
    const logger = GLogger.getLogger();

    // 获取 AccountID（缓存以避免重复调用）
    if (!this.accountId) {
      const credential = await this.inputs.getCredential();
      this.accountId = credential.AccountID;
    }

    const fullArn = `acs:ram::${this.accountId}:role/${role}`;

    logger.debug(
      `Converting simplified role name "${role}" to full ARN: ${fullArn}`,
    );

    return fullArn;
  }

  /**
   * 将新 YAML 格式转换为内部使用的格式（与旧代码保持一致）
   */
  private normalizeAgentConfig(config: any): AgentRuntimeConfig {
    const logger = GLogger.getLogger();
    logger.debug("Converting new YAML format to internal format");

    const normalized: any = {
      agentRuntimeName: config.name,
      description: config.description,
      cpu: config.cpu,
      memory: config.memory,
      diskSize: config.diskSize,
      port: config.port,
      sessionConcurrencyLimitPerInstance: config.instanceConcurrency,
      sessionIdleTimeoutSeconds: config.sessionIdleTimeoutSeconds,
      environmentVariables: config.environmentVariables,
      executionRoleArn: config.role, // 保存原始值，稍后在需要时转换
      credentialName: config.credentialName,
    };

    // 处理代码配置
    if (config.code) {
      if (typeof config.code !== "object") {
        throw new Error(
          "code must be an object with src or ossBucketName/ossObjectName",
        );
      }

      if (!config.code.language) {
        throw new Error("code.language is required");
      }

      const hasSrc = config.code.src;
      const hasOss = config.code.ossBucketName && config.code.ossObjectName;

      if (!hasSrc && !hasOss) {
        throw new Error(
          "code.src or (code.ossBucketName + code.ossObjectName) must be provided",
        );
      }

      normalized.artifactType = "Code";
      normalized.codeConfiguration = {
        language: config.code.language,
        command: config.code.command || [],
        checksum: config.code.checksum,
      };

      if (config.code.src) {
        normalized.codeConfiguration.zipFile = config.code.src;
      } else if (hasOss) {
        normalized.codeConfiguration.ossBucketName = config.code.ossBucketName;
        normalized.codeConfiguration.ossObjectName = config.code.ossObjectName;
      }
    } else if (config.customContainerConfig) {
      // 处理容器配置
      normalized.artifactType = "Container";

      let command = config.customContainerConfig.command;
      if (command && !Array.isArray(command)) {
        command = [command];
      }

      normalized.containerConfiguration = {
        image: config.customContainerConfig.image,
        command: command || [],
        imageRegistryType: config.customContainerConfig.imageRegistryType,
        acrInstanceId: config.customContainerConfig.acrInstanceId,
      };
    } else {
      throw new Error("Either code or customContainerConfig must be provided");
    }

    // 处理网络配置
    if (config.vpcConfig || config.internetAccess !== undefined) {
      normalized.networkConfiguration = {};

      if (config.vpcConfig) {
        normalized.networkConfiguration.vpcId = config.vpcConfig.vpcId;
        normalized.networkConfiguration.securityGroupId =
          config.vpcConfig.securityGroupId;

        if (config.vpcConfig.vSwitchIds) {
          normalized.networkConfiguration.vswitchIds = Array.isArray(
            config.vpcConfig.vSwitchIds,
          )
            ? config.vpcConfig.vSwitchIds
            : [config.vpcConfig.vSwitchIds];
        }

        if (config.internetAccess !== false) {
          normalized.networkConfiguration.networkMode = "PUBLIC_AND_PRIVATE";
        } else {
          normalized.networkConfiguration.networkMode = "PRIVATE";
        }
      } else {
        normalized.networkConfiguration.networkMode =
          config.internetAccess !== false ? "PUBLIC" : "PRIVATE";
      }
    }

    // 处理日志配置
    if (config.logConfig) {
      if (config.logConfig === "auto") {
        this.autolog = true;
      } else {
        normalized.logConfiguration = {
          project: config.logConfig.project,
          logstore: config.logConfig.logstore,
        };
      }
    }

    // 处理协议配置
    if (config.protocolConfiguration) {
      normalized.protocolConfiguration = {
        type: config.protocolConfiguration.type || "HTTP",
      };
    }

    // 处理健康检查配置
    if (config.healthCheckConfiguration) {
      normalized.healthCheckConfiguration = {
        httpGetUrl: config.healthCheckConfiguration.httpGetUrl || "/health",
        initialDelaySeconds:
          config.healthCheckConfiguration.initialDelaySeconds || 30,
        periodSeconds: config.healthCheckConfiguration.periodSeconds || 30,
        timeoutSeconds: config.healthCheckConfiguration.timeoutSeconds || 3,
        failureThreshold: config.healthCheckConfiguration.failureThreshold || 3,
        successThreshold: config.healthCheckConfiguration.successThreshold || 1,
      };
    }

    // 处理端点配置
    if (config.endpoints && config.endpoints.length > 0) {
      normalized.endpoints = config.endpoints.map((ep: any) => {
        const normalizedEp: any = {
          endpointName: ep.name,
          description: ep.description,
          targetVersion:
            ep.version !== undefined ? String(ep.version) : "LATEST",
        };

        if (ep.weight !== undefined) {
          normalizedEp.grayTrafficWeight = {
            version: String(ep.version || "LATEST"),
            weight: ep.weight,
          };
        }

        return normalizedEp;
      });
    }

    logger.debug(`Normalized config: ${JSON.stringify(normalized, null, 2)}`);
    return normalized as AgentRuntimeConfig;
  }

  private async initClient(command: string) {
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
      }command:${command}`,
    });

    this.agentRuntimeClient = new Client(clientConfig);
  }

  /**
   * 初始化 FC2 客户端（用于获取临时 OSS Token）
   */
  private async initFC2Client(): Promise<FC2> {
    if (this.fc2Client) {
      return this.fc2Client;
    }

    const credentials = await this.inputs.getCredential();
    this.fc2Client = createFC2Client(this.region, credentials);
    return this.fc2Client;
  }

  /**
   * 上传代码包到临时 OSS（完全复用 FC3 实现）
   */
  private async uploadCodeToTmpOss(
    zipFile: string,
  ): Promise<{ ossBucketName: string; ossObjectName: string }> {
    const logger = GLogger.getLogger();
    const client = await this.initFC2Client();

    logger.debug("Getting temporary OSS bucket token...");
    const {
      data: { credentials, ossBucket, objectName },
    } = await (client as any).getTempBucketToken();

    let ossEndpoint = "https://oss-accelerate.aliyuncs.com";

    if (process.env.FC_REGION === this.region) {
      ossEndpoint = `oss-${this.region}-internal.aliyuncs.com`;
    }

    if (process.env.AGENTRUN_CUSTOM_ENDPOINT) {
      ossEndpoint = `oss-${this.region}.aliyuncs.com`;
    }

    if (this.region === "cn-shanghai-finance-1") {
      if (process.env.FC_REGION === this.region) {
        ossEndpoint = `oss-${this.region}-pub-internal.aliyuncs.com`;
      } else {
        ossEndpoint = `oss-${this.region}-pub.aliyuncs.com`;
      }
    }

    if (this.region === "cn-heyuan-acdr-1") {
      ossEndpoint = `oss-${this.region}-internal.aliyuncs.com`;
    }

    if (process.env.FC_CODE_TEMP_OSS_ENDPOINT) {
      ossEndpoint = process.env.FC_CODE_TEMP_OSS_ENDPOINT;
    }

    logger.debug(`Uploading code to ${ossEndpoint}`);

    const ossClient = new OSS({
      endpoint: ossEndpoint,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: ossBucket,
      timeout: "600000",
      refreshSTSToken: async () => {
        const refreshToken = await axios.get("https://127.0.0.1/sts");
        return {
          accessKeyId: refreshToken.data.credentials.AccessKeyId,
          accessKeySecret: refreshToken.data.credentials.AccessKeySecret,
          stsToken: refreshToken.data.credentials.SecurityToken,
        };
      },
    });

    const credential = await this.inputs.getCredential();
    const accountId = credential.AccountID;
    const ossObjectName = `${accountId}/${objectName}`;

    logger.info("Uploading code to temporary OSS...");
    await (ossClient as any).put(ossObjectName, path.normalize(zipFile));
    logger.info(chalk.green("Code uploaded successfully"));

    const config = { ossBucketName: ossBucket, ossObjectName };
    logger.debug(`tempCodeBucketToken response: ${JSON.stringify(config)}`);
    return config;
  }

  /**
   * 判断是否需要压缩代码（与 FC3 相同逻辑）
   */
  private assertNeedZip(codeUri: string): boolean {
    if (codeUri.endsWith(".jar")) {
      const command = this.agentRuntimeConfig.codeConfiguration?.command || [];
      const commandStr = Array.isArray(command)
        ? command.join(" ")
        : String(command);

      if (commandStr.includes("java -jar")) {
        return true;
      }
      return false;
    }

    return !codeUri.endsWith(".zip");
  }

  /**
   * 处理代码上传（压缩 + 上传到临时 OSS）
   */
  private async processCodeUpload(): Promise<boolean> {
    const logger = GLogger.getLogger();
    const codeConfig = this.agentRuntimeConfig.codeConfiguration;

    if (!codeConfig) {
      return false;
    }

    const codeUri = codeConfig.zipFile;
    if (!codeUri) {
      if (codeConfig.ossBucketName && codeConfig.ossObjectName) {
        logger.debug("Code already has OSS configuration, skipping upload");
        return true;
      }
      throw new Error("Code configuration is empty");
    }

    let zipPath: string = path.isAbsolute(codeUri)
      ? codeUri
      : path.join(this.baseDir, codeUri);

    logger.debug(`Code path absolute path: ${zipPath}`);

    const needZip = this.assertNeedZip(codeUri);
    logger.debug(`Need zip file: ${needZip}`);

    let generateZipFilePath = "";
    if (needZip) {
      const zipConfig = {
        codeUri: zipPath,
        outputFileName: `${this.region}_${this.agentRuntimeConfig.agentRuntimeName}_${Date.now()}`,
        outputFilePath: path.join(getRootHome(), ".s", "agentrun", "zip"),
        ignoreFiles: [".arignore", ".fcignore"],
      };

      logger.info("Compressing code...");
      const start = new Date();
      generateZipFilePath = (await zip(zipConfig)).outputFile;
      const end = new Date();
      const milliseconds = end.getTime() - start.getTime();
      logger.debug(`Compression time: ${milliseconds / 1000}s`);
      zipPath = generateZipFilePath;
      logger.info(chalk.green("Code compressed successfully"));
    }

    getFileSize(zipPath);

    try {
      const ossConfig = await this.uploadCodeToTmpOss(zipPath);
      logger.debug("ossConfig: ", ossConfig);

      this.agentRuntimeConfig.codeConfiguration.ossBucketName =
        ossConfig.ossBucketName;
      this.agentRuntimeConfig.codeConfiguration.ossObjectName =
        ossConfig.ossObjectName;
      delete this.agentRuntimeConfig.codeConfiguration.zipFile;
    } finally {
      if (generateZipFilePath) {
        try {
          fs.rmSync(generateZipFilePath);
          logger.debug(`Removed temporary zip file: ${generateZipFilePath}`);
        } catch (ex) {
          logger.debug(`Unable to remove zip file: ${zipPath}`);
        }
      }
    }

    return true;
  }

  async deploy() {
    await this.initClient("deploy");
    const logger = GLogger.getLogger();
    logger.info(chalk.green("Start deploy agent runtime instance."));

    if (this.agentRuntimeConfig.artifactType === "Code") {
      logger.info("Processing code upload...");
      try {
        await this.processCodeUpload();
      } catch (e) {
        logger.error(`Failed to upload code: ${e.message}`);
        throw e;
      }
    }

    if (this.autolog) {
      const sls = new Sls(this.region, await this.inputs.getCredential());
      const { project, logstore } = await sls.deploy();
      logger.write(
        chalk.yellow(`Created log resource succeeded, please replace logConfig: auto in yaml with:
logConfig:
  logstore: ${logstore}
  project: ${project}\n`),
      );

      this.agentRuntimeConfig.logConfiguration = {
        project,
        logstore,
      };
    }

    logger.info(
      `finding agent runtime with name: ${this.agentRuntimeConfig.agentRuntimeName}`,
    );
    let runtimeId = await this.findAgentRuntimeByName();
    if (runtimeId == "") {
      logger.info(
        `agent runtime[name=${this.agentRuntimeConfig.agentRuntimeName}, region=${this.region}] not found, creating...`,
      );
      runtimeId = await this.createAgentRuntime();
    } else {
      logger.info(
        `agent runtime[name=${this.agentRuntimeConfig.agentRuntimeName}, region=${this.region}] found, updating...`,
      );
      await this.updateAgentRuntime(runtimeId);
    }
    logger.info(`using agent runtime: ${runtimeId}`);
    this.agentRuntimeId = runtimeId;

    logger.info("checking agent runtime status...");
    await this.waitForAgentRuntimeReady(runtimeId);

    if (
      this.agentRuntimeConfig.endpoints &&
      this.agentRuntimeConfig.endpoints.length > 0
    ) {
      logger.info(
        `processing ${this.agentRuntimeConfig.endpoints.length} endpoint(s)...`,
      );
      await this.createOrUpdateEndpoints(runtimeId);
      logger.info("waiting for endpoints to be ready...");
      await this.waitForEndpointsReady(runtimeId);
    }

    // 处理自定义域名
    const customDomainConfig = this.inputs.props.agent?.customDomain;
    let customDomainResult: any;
    if (customDomainConfig) {
      const functionName = `agentrun-${runtimeId}`;
      logger.info(`deploying custom domain for function: ${functionName}...`);
      try {
        customDomainResult = await deployCustomDomain(
          this.inputs,
          customDomainConfig,
          this.region,
          functionName,
          logger,
        );
        logger.info(chalk.green("Custom domain deployed successfully."));
      } catch (e) {
        logger.error(`Failed to deploy custom domain: ${e.message}`);
        throw e;
      }
    }

    logger.info(
      chalk.green(
        `Agent runtime ${this.agentRuntimeConfig.agentRuntimeName} deployed successfully.`,
      ),
    );

    return this.getOutputs(runtimeId, customDomainResult);
  }

  private async findAgentRuntimeByName(): Promise<string> {
    const logger = GLogger.getLogger();
    const listRequest = new ListAgentRuntimesRequest();
    listRequest.agentRuntimeName = this.agentRuntimeConfig.agentRuntimeName;
    listRequest.pageNumber = 1;
    listRequest.pageSize = 100;
    listRequest.searchMode = "exact";

    try {
      const result =
        await this.agentRuntimeClient.listAgentRuntimes(listRequest);
      if (result.statusCode != 200) {
        logger.error(
          `list agent runtimes failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        return "";
      }
      if (_.isEmpty(result.body?.data?.items)) {
        logger.debug(
          `no agent runtime found with name ${this.agentRuntimeConfig.agentRuntimeName}`,
        );
        return "";
      }
      const runtime = result.body.data.items.find(
        (item) =>
          item.agentRuntimeName == this.agentRuntimeConfig.agentRuntimeName,
      );
      if (runtime == undefined) {
        return "";
      }
      return runtime.agentRuntimeId || "";
    } catch (e) {
      logger.error(`list agent runtimes failed, message: ${e.message}`);
      throw e;
    }
  }

  private async createAgentRuntime(): Promise<string> {
    const logger = GLogger.getLogger();
    const createInput = new CreateAgentRuntimeInput();

    createInput.agentRuntimeName = this.agentRuntimeConfig.agentRuntimeName;
    createInput.description = this.agentRuntimeConfig.description;
    createInput.artifactType = this.agentRuntimeConfig.artifactType;
    createInput.cpu = this.agentRuntimeConfig.cpu;
    createInput.memory = this.agentRuntimeConfig.memory;
    createInput.diskSize = this.agentRuntimeConfig.diskSize;
    createInput.port = this.agentRuntimeConfig.port;

    if (
      this.agentRuntimeConfig.sessionConcurrencyLimitPerInstance !== undefined
    ) {
      createInput.sessionConcurrencyLimitPerInstance =
        this.agentRuntimeConfig.sessionConcurrencyLimitPerInstance;
    }

    if (this.agentRuntimeConfig.sessionIdleTimeoutSeconds !== undefined) {
      createInput.sessionIdleTimeoutSeconds =
        this.agentRuntimeConfig.sessionIdleTimeoutSeconds;
    }

    if (this.agentRuntimeConfig.credentialName) {
      createInput.credentialName = this.agentRuntimeConfig.credentialName;
    }

    // 处理代码配置
    if (
      this.agentRuntimeConfig.artifactType === "Code" &&
      this.agentRuntimeConfig.codeConfiguration
    ) {
      const codeConfig = new CodeConfiguration();
      const userCodeConfig = this.agentRuntimeConfig.codeConfiguration;

      if (userCodeConfig.ossBucketName && userCodeConfig.ossObjectName) {
        codeConfig.ossBucketName = userCodeConfig.ossBucketName;
        codeConfig.ossObjectName = userCodeConfig.ossObjectName;
        logger.debug(
          `Using OSS code: ${userCodeConfig.ossBucketName}/${userCodeConfig.ossObjectName}`,
        );
      } else {
        throw new Error(
          "Code must be uploaded to OSS before creating agent runtime",
        );
      }

      codeConfig.language = userCodeConfig.language;
      codeConfig.command = userCodeConfig.command;
      if (userCodeConfig.checksum) {
        codeConfig.checksum = userCodeConfig.checksum;
      }
      createInput.codeConfiguration = codeConfig;
    }

    // 处理容器配置
    if (
      this.agentRuntimeConfig.artifactType === "Container" &&
      this.agentRuntimeConfig.containerConfiguration
    ) {
      const containerConfig = new ContainerConfiguration();
      const userContainerConfig =
        this.agentRuntimeConfig.containerConfiguration;
      containerConfig.image = userContainerConfig.image;
      containerConfig.command = userContainerConfig.command;
      if (userContainerConfig.imageRegistryType) {
        containerConfig.imageRegistryType =
          userContainerConfig.imageRegistryType;
      }
      if (userContainerConfig.acrInstanceId) {
        containerConfig.acrInstanceId = userContainerConfig.acrInstanceId;
      }
      createInput.containerConfiguration = containerConfig;
    }

    // 处理网络配置
    if (this.agentRuntimeConfig.networkConfiguration) {
      const networkConfig = new NetworkConfiguration();
      networkConfig.networkMode =
        this.agentRuntimeConfig.networkConfiguration.networkMode;
      networkConfig.vpcId = this.agentRuntimeConfig.networkConfiguration.vpcId;
      if (this.agentRuntimeConfig.networkConfiguration.vswitchIds) {
        networkConfig.vswitchIds =
          this.agentRuntimeConfig.networkConfiguration.vswitchIds;
      }
      networkConfig.securityGroupId =
        this.agentRuntimeConfig.networkConfiguration.securityGroupId;
      createInput.networkConfiguration = networkConfig;
    }

    createInput.environmentVariables =
      this.agentRuntimeConfig.environmentVariables;

    // ✅ 在真正需要时才转换 role ARN
    if (this.agentRuntimeConfig.executionRoleArn) {
      createInput.executionRoleArn = await this.normalizeRoleArn(
        this.agentRuntimeConfig.executionRoleArn,
      );
    }

    // 处理日志配置
    if (this.agentRuntimeConfig.logConfiguration) {
      const logConfig = new LogConfiguration();
      logConfig.project = this.agentRuntimeConfig.logConfiguration.project;
      logConfig.logstore = this.agentRuntimeConfig.logConfiguration.logstore;
      createInput.logConfiguration = logConfig;
    }

    // 处理协议配置
    if (this.agentRuntimeConfig.protocolConfiguration) {
      const protocolConfig = new ProtocolConfiguration();
      protocolConfig.type = this.agentRuntimeConfig.protocolConfiguration.type;
      createInput.protocolConfiguration = protocolConfig;
    }

    // 处理健康检查配置
    if (this.agentRuntimeConfig.healthCheckConfiguration) {
      const healthCheckConfig = new HealthCheckConfiguration();
      const userHealthCheck = this.agentRuntimeConfig.healthCheckConfiguration;
      healthCheckConfig.httpGetUrl = userHealthCheck.httpGetUrl;
      healthCheckConfig.initialDelaySeconds =
        userHealthCheck.initialDelaySeconds;
      healthCheckConfig.periodSeconds = userHealthCheck.periodSeconds;
      healthCheckConfig.timeoutSeconds = userHealthCheck.timeoutSeconds;
      healthCheckConfig.failureThreshold = userHealthCheck.failureThreshold;
      healthCheckConfig.successThreshold = userHealthCheck.successThreshold;
      createInput.healthCheckConfiguration = healthCheckConfig;
    }

    const createRequest = new CreateAgentRuntimeRequest();
    createRequest.body = createInput;

    logger.debug(
      `creating agent runtime, request: ${JSON.stringify(createInput)}`,
    );
    const resp =
      await this.agentRuntimeClient.createAgentRuntime(createRequest);
    if (resp.statusCode != 200 && resp.statusCode != 201) {
      logger.error(
        `create agent runtime failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
      );
      throw new Error(
        `failed to create agent runtime for ${this.agentRuntimeConfig.agentRuntimeName}`,
      );
    }

    const runtimeId = resp.body?.data?.agentRuntimeId;
    if (!runtimeId) {
      logger.error(
        `failed to get agent runtime ID from create response. Response body: ${JSON.stringify(resp.body, null, 2)}`,
      );
      throw new Error(`failed to get agent runtime ID from create response`);
    }

    logger.info(
      `agent runtime created successfully with ID: ${runtimeId}, status: CREATING`,
    );
    return runtimeId;
  }

  private async updateAgentRuntime(runtimeId: string): Promise<void> {
    const logger = GLogger.getLogger();
    const updateInput = new UpdateAgentRuntimeInput();

    updateInput.description = this.agentRuntimeConfig.description;
    updateInput.cpu = this.agentRuntimeConfig.cpu;
    updateInput.memory = this.agentRuntimeConfig.memory;
    updateInput.diskSize = this.agentRuntimeConfig.diskSize;
    updateInput.port = this.agentRuntimeConfig.port;
    updateInput.artifactType = this.agentRuntimeConfig.artifactType;

    if (
      this.agentRuntimeConfig.sessionConcurrencyLimitPerInstance !== undefined
    ) {
      updateInput.sessionConcurrencyLimitPerInstance =
        this.agentRuntimeConfig.sessionConcurrencyLimitPerInstance;
    }

    if (this.agentRuntimeConfig.sessionIdleTimeoutSeconds !== undefined) {
      updateInput.sessionIdleTimeoutSeconds =
        this.agentRuntimeConfig.sessionIdleTimeoutSeconds;
    }

    if (this.agentRuntimeConfig.credentialName) {
      updateInput.credentialName = this.agentRuntimeConfig.credentialName;
    }

    // 处理代码配置
    if (
      this.agentRuntimeConfig.artifactType === "Code" &&
      this.agentRuntimeConfig.codeConfiguration
    ) {
      const codeConfig = new CodeConfiguration();
      const userCodeConfig = this.agentRuntimeConfig.codeConfiguration;

      if (userCodeConfig.ossBucketName && userCodeConfig.ossObjectName) {
        codeConfig.ossBucketName = userCodeConfig.ossBucketName;
        codeConfig.ossObjectName = userCodeConfig.ossObjectName;
        logger.debug(
          `Using OSS code: ${userCodeConfig.ossBucketName}/${userCodeConfig.ossObjectName}`,
        );
      } else {
        throw new Error(
          "Code must be uploaded to OSS before updating agent runtime",
        );
      }

      codeConfig.language = userCodeConfig.language;
      codeConfig.command = userCodeConfig.command;
      if (userCodeConfig.checksum) {
        codeConfig.checksum = userCodeConfig.checksum;
      }
      updateInput.codeConfiguration = codeConfig;
    }

    // 处理容器配置
    if (
      this.agentRuntimeConfig.artifactType === "Container" &&
      this.agentRuntimeConfig.containerConfiguration
    ) {
      const containerConfig = new ContainerConfiguration();
      const userContainerConfig =
        this.agentRuntimeConfig.containerConfiguration;
      containerConfig.image = userContainerConfig.image;
      containerConfig.command = userContainerConfig.command;
      if (userContainerConfig.imageRegistryType) {
        containerConfig.imageRegistryType =
          userContainerConfig.imageRegistryType;
      }
      if (userContainerConfig.acrInstanceId) {
        containerConfig.acrInstanceId = userContainerConfig.acrInstanceId;
      }
      updateInput.containerConfiguration = containerConfig;
    }

    // 处理网络配置
    if (this.agentRuntimeConfig.networkConfiguration) {
      const networkConfig = new NetworkConfiguration();
      networkConfig.networkMode =
        this.agentRuntimeConfig.networkConfiguration.networkMode;
      networkConfig.vpcId = this.agentRuntimeConfig.networkConfiguration.vpcId;
      if (this.agentRuntimeConfig.networkConfiguration.vswitchIds) {
        networkConfig.vswitchIds =
          this.agentRuntimeConfig.networkConfiguration.vswitchIds;
      }
      networkConfig.securityGroupId =
        this.agentRuntimeConfig.networkConfiguration.securityGroupId;
      updateInput.networkConfiguration = networkConfig;
    }

    updateInput.environmentVariables =
      this.agentRuntimeConfig.environmentVariables;

    // ✅ 在真正需要时才转换 role ARN
    if (this.agentRuntimeConfig.executionRoleArn) {
      updateInput.executionRoleArn = await this.normalizeRoleArn(
        this.agentRuntimeConfig.executionRoleArn,
      );
    }

    // 处理日志配置
    if (this.agentRuntimeConfig.logConfiguration) {
      const logConfig = new LogConfiguration();
      logConfig.project = this.agentRuntimeConfig.logConfiguration.project;
      logConfig.logstore = this.agentRuntimeConfig.logConfiguration.logstore;
      updateInput.logConfiguration = logConfig;
    }

    // 处理协议配置
    if (this.agentRuntimeConfig.protocolConfiguration) {
      const protocolConfig = new ProtocolConfiguration();
      protocolConfig.type = this.agentRuntimeConfig.protocolConfiguration.type;
      updateInput.protocolConfiguration = protocolConfig;
    }

    // 处理健康检查配置
    if (this.agentRuntimeConfig.healthCheckConfiguration) {
      const healthCheckConfig = new HealthCheckConfiguration();
      const userHealthCheck = this.agentRuntimeConfig.healthCheckConfiguration;
      healthCheckConfig.httpGetUrl = userHealthCheck.httpGetUrl;
      healthCheckConfig.initialDelaySeconds =
        userHealthCheck.initialDelaySeconds;
      healthCheckConfig.periodSeconds = userHealthCheck.periodSeconds;
      healthCheckConfig.timeoutSeconds = userHealthCheck.timeoutSeconds;
      healthCheckConfig.failureThreshold = userHealthCheck.failureThreshold;
      healthCheckConfig.successThreshold = userHealthCheck.successThreshold;
      updateInput.healthCheckConfiguration = healthCheckConfig;
    }

    const updateRequest = new UpdateAgentRuntimeRequest();
    updateRequest.body = updateInput;

    logger.debug(
      `updating agent runtime, request: ${JSON.stringify(updateInput)}`,
    );
    const resp = await this.agentRuntimeClient.updateAgentRuntime(
      runtimeId,
      updateRequest,
    );
    if (resp.statusCode != 200 && resp.statusCode != 202) {
      logger.error(
        `update agent runtime failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
      );
      throw new Error(
        `failed to update agent runtime for ${this.agentRuntimeConfig.agentRuntimeName}`,
      );
    }

    logger.info(
      `agent runtime updated successfully with ID: ${runtimeId}, status: UPDATING`,
    );
  }

  private async createOrUpdateEndpoints(runtimeId: string) {
    const logger = GLogger.getLogger();
    if (
      !this.agentRuntimeConfig.endpoints ||
      this.agentRuntimeConfig.endpoints.length === 0
    ) {
      return;
    }

    const existingEndpoints = await this.listEndpoints(runtimeId);
    const existingEndpointsMap = new Map<string, any>();
    if (existingEndpoints && existingEndpoints.length > 0) {
      for (const ep of existingEndpoints) {
        if (ep.agentRuntimeEndpointName) {
          existingEndpointsMap.set(ep.agentRuntimeEndpointName, ep);
        }
      }
    }

    for (const endpointConfig of this.agentRuntimeConfig.endpoints) {
      const existingEndpoint = existingEndpointsMap.get(
        endpointConfig.endpointName,
      );

      if (existingEndpoint) {
        logger.info(`updating endpoint ${endpointConfig.endpointName}...`);
        await this.updateAgentRuntimeEndpoint(
          runtimeId,
          existingEndpoint.agentRuntimeEndpointId || "",
          endpointConfig,
        );
      } else {
        logger.info(`creating endpoint ${endpointConfig.endpointName}...`);
        await this.createEndpoint(endpointConfig);
      }
    }
  }

  public async createEndpoint(endpointConfig: any): Promise<void> {
    const logger = GLogger.getLogger();
    const endpointInput = new CreateAgentRuntimeEndpointInput();
    endpointInput.agentRuntimeEndpointName = endpointConfig.endpointName;
    endpointInput.description = endpointConfig.description;
    endpointInput.targetVersion =
      endpointConfig.targetVersion !== undefined
        ? String(endpointConfig.targetVersion)
        : "LATEST";

    if (endpointConfig.grayTrafficWeight) {
      const routingConfig = new RoutingConfiguration();
      const versionWeight = new VersionWeight();
      versionWeight.version = String(endpointConfig.grayTrafficWeight.version);
      versionWeight.weight = endpointConfig.grayTrafficWeight.weight;
      routingConfig.versionWeights = [versionWeight];
      endpointInput.routingConfiguration = routingConfig;
    }

    const endpointRequest = new CreateAgentRuntimeEndpointRequest();
    endpointRequest.body = endpointInput;

    logger.debug(`creating endpoint ${endpointConfig.endpointName}...`);
    try {
      const resp = await this.agentRuntimeClient.createAgentRuntimeEndpoint(
        this.agentRuntimeId,
        endpointRequest,
      );
      if (resp.statusCode != 200 && resp.statusCode != 201) {
        logger.error(
          `create endpoint failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
        );
        throw new Error(
          `failed to create endpoint ${endpointConfig.endpointName}`,
        );
      }
      logger.info(
        `endpoint ${endpointConfig.endpointName} created successfully`,
      );
    } catch (e) {
      logger.error(
        `failed to create endpoint ${endpointConfig.endpointName}: ${e.message}`,
      );
      throw e;
    }
  }

  public async updateAgentRuntimeEndpoint(
    runtimeId: string,
    endpointId: string,
    endpointConfig: any,
  ): Promise<void> {
    const logger = GLogger.getLogger();
    const updateInput = new UpdateAgentRuntimeEndpointInput();
    updateInput.description = endpointConfig.description;
    updateInput.targetVersion =
      endpointConfig.targetVersion !== undefined
        ? String(endpointConfig.targetVersion)
        : "LATEST";

    if (endpointConfig.grayTrafficWeight) {
      const routingConfig = new RoutingConfiguration();
      const versionWeight = new VersionWeight();
      versionWeight.version = String(endpointConfig.grayTrafficWeight.version);
      versionWeight.weight = endpointConfig.grayTrafficWeight.weight;
      routingConfig.versionWeights = [versionWeight];
      updateInput.routingConfiguration = routingConfig;
    }

    const updateRequest = new UpdateAgentRuntimeEndpointRequest();
    updateRequest.body = updateInput;

    logger.debug(`updating endpoint ${endpointConfig.endpointName}...`);
    try {
      const resp = await this.agentRuntimeClient.updateAgentRuntimeEndpoint(
        runtimeId,
        endpointId,
        updateRequest,
      );
      if (resp.statusCode != 200 && resp.statusCode != 202) {
        logger.error(
          `update endpoint failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
        );
        throw new Error(
          `failed to update endpoint ${endpointConfig.endpointName}`,
        );
      }
      logger.info(
        `endpoint ${endpointConfig.endpointName} updated successfully`,
      );
    } catch (e) {
      logger.error(
        `failed to update endpoint ${endpointConfig.endpointName}: ${e.message}`,
      );
      throw e;
    }
  }

  async remove() {
    await this.initClient("remove");
    const logger = GLogger.getLogger();
    const runtimeId = await this.findAgentRuntimeByName();
    if (runtimeId == "") {
      logger.info(
        `agent runtime ${this.agentRuntimeConfig.agentRuntimeName} not found`,
      );
      return;
    }
    logger.info(`remove agent runtime: ${runtimeId}`);
    const msg = `Do you want to delete agent runtime: ${runtimeId}`;
    if (!this.assumeYes && !(await promptForConfirmOrDetails(msg))) {
      return;
    }

    // 先移除自定义域名路由
    const customDomainConfig = this.inputs.props.agent?.customDomain;
    if (customDomainConfig) {
      const functionName = `agentrun-${runtimeId}`;
      logger.info(
        `removing custom domain route for function: ${functionName}...`,
      );
      try {
        await removeCustomDomain(
          this.inputs,
          customDomainConfig,
          this.region,
          functionName,
          logger,
        );
      } catch (e) {
        logger.warn(`failed to remove custom domain: ${e.message}`);
      }
    }

    const endpoints = await this.listEndpoints(runtimeId);
    if (endpoints && endpoints.length > 0) {
      logger.info(`found ${endpoints.length} endpoint(s), deleting...`);
      for (const endpoint of endpoints) {
        try {
          const deleteEndpointResp =
            await this.agentRuntimeClient.deleteAgentRuntimeEndpoint(
              runtimeId,
              endpoint.agentRuntimeEndpointId || "",
            );
          if (
            deleteEndpointResp.statusCode != 200 &&
            deleteEndpointResp.statusCode != 202 &&
            deleteEndpointResp.statusCode != 404
          ) {
            logger.warn(
              `delete endpoint failed, statusCode: ${deleteEndpointResp.statusCode}, requestId: ${deleteEndpointResp.body?.requestId}`,
            );
          } else {
            logger.info(
              `endpoint ${endpoint.agentRuntimeEndpointName} deleted`,
            );
          }
        } catch (e) {
          logger.warn(
            `failed to delete endpoint ${endpoint.agentRuntimeEndpointName}: ${e.message}`,
          );
        }
      }
    }

    const resp = await this.agentRuntimeClient.deleteAgentRuntime(runtimeId);
    if (
      resp.statusCode != 200 &&
      resp.statusCode != 202 &&
      resp.statusCode != 404
    ) {
      logger.error(
        `delete agent runtime failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
      );
      throw new Error(`delete agent runtime failed, message: ${resp.body}`);
    }
    logger.info(`agent runtime ${runtimeId} deleted`);
    return;
  }

  async info(): Promise<AgentRuntimeOutput> {
    await this.initClient("info");

    const runtimeId = await this.findAgentRuntimeByName();
    if (runtimeId == "") {
      throw new Error(
        `agent runtime ${this.agentRuntimeConfig.agentRuntimeName} not found`,
      );
    }
    this.agentRuntimeId = runtimeId;
    return await this.getOutputs(runtimeId);
  }

  private async getOutputs(
    runtimeId: string,
    customDomainResult?: any,
  ): Promise<AgentRuntimeOutput> {
    const result = new AgentRuntimeOutput();
    const getRequest = new GetAgentRuntimeRequest({});
    const resp = await this.agentRuntimeClient.getAgentRuntime(
      runtimeId,
      getRequest,
    );
    if (resp.statusCode != 200) {
      throw new Error(
        `failed to get agent runtime for ${this.agentRuntimeConfig.agentRuntimeName}, requestId: ${resp.body?.requestId}`,
      );
    }

    const runtime = resp.body?.data;
    if (!runtime) {
      throw new Error(`agent runtime ${runtimeId} not found`);
    }

    const endpoints = await this.listEndpoints(runtimeId);
    const endpointsOutput = endpoints?.map((ep) => ({
      id: ep.agentRuntimeEndpointId || "",
      arn: ep.agentRuntimeEndpointArn || "",
      name: ep.agentRuntimeEndpointName || "",
      url: ep.endpointPublicUrl,
      version: ep.targetVersion,
      status: ep.status,
      description: ep.description,
      routingConfig: ep.routingConfiguration
        ? {
            weights: ep.routingConfiguration.versionWeights?.map((vw: any) => ({
              version: vw.version,
              weight: vw.weight,
            })),
          }
        : undefined,
    }));

    // 获取自定义域名信息
    let customDomainOutput:
      | { domainName: string; protocol: string }
      | undefined;
    const customDomainConfig = this.inputs.props.agent?.customDomain;
    if (customDomainResult) {
      customDomainOutput = {
        domainName: customDomainResult.domainName || "",
        protocol: customDomainResult.protocol || "",
      };
    } else if (customDomainConfig) {
      const functionName = `agentrun-${runtimeId}`;
      const domainInfo = await infoCustomDomain(
        this.inputs,
        customDomainConfig,
        this.region,
        functionName,
      );
      if (domainInfo) {
        customDomainOutput = {
          domainName: domainInfo.domainName || "",
          protocol: domainInfo.protocol || "",
        };
      }
    }

    result.agent = {
      id: runtime.agentRuntimeId || "",
      arn: runtime.agentRuntimeArn || "",
      name: runtime.agentRuntimeName || "",
      version: runtime.agentRuntimeVersion,
      description: runtime.description,
      artifactType: runtime.artifactType || "",
      status: runtime.status,
      resources: {
        cpu: runtime.cpu || 0,
        memory: runtime.memory || 0,
        diskSize: runtime.diskSize || 0,
        port: runtime.port || 0,
      },
      timestamps: {
        createdAt: runtime.createdAt,
        lastUpdatedAt: runtime.lastUpdatedAt,
      },
      region: this.region,
      endpoints: endpointsOutput,
      customDomain: customDomainOutput,
    };

    return result;
  }

  public async listEndpoints(runtimeId: string) {
    const listRequest = new ListAgentRuntimeEndpointsRequest();
    listRequest.pageNumber = 1;
    listRequest.pageSize = 100;

    try {
      const resp = await this.agentRuntimeClient.listAgentRuntimeEndpoints(
        runtimeId,
        listRequest,
      );
      if (resp.statusCode != 200) {
        GLogger.getLogger().warn(
          `list endpoints failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
        );
        return [];
      }
      return resp.body?.data?.items || [];
    } catch (e) {
      GLogger.getLogger().warn(`list endpoints failed: ${e.message}`);
      return [];
    }
  }

  private async waitForAgentRuntimeReady(runtimeId: string) {
    const logger = GLogger.getLogger();
    const timeoutMill = 15 * 60 * 1000;
    const intervalMill = 10 * 1000;
    const eol = Date.now() + timeoutMill;

    while (Date.now() < eol) {
      const getRequest = new GetAgentRuntimeRequest({});
      try {
        const resp = await this.agentRuntimeClient.getAgentRuntime(
          runtimeId,
          getRequest,
        );
        if (resp.statusCode != 200) {
          logger.debug(
            `get agent runtime failed, statusCode: ${resp.statusCode}, requestId: ${resp.body?.requestId}`,
          );
          await sleep(intervalMill);
          continue;
        }

        const runtime = resp.body?.data;
        if (!runtime) {
          logger.debug("agent runtime not found, retrying...");
          await sleep(intervalMill);
          continue;
        }

        const status = runtime.status;
        logger.debug(`agent runtime status: ${status}`);

        if (status === "READY") {
          logger.info(`agent runtime ${runtimeId} is ready`);
          return;
        } else if (
          status === "FAILED" ||
          status === "CREATE_FAILED" ||
          status === "UPDATE_FAILED" ||
          status === "DELETE_FAILED"
        ) {
          const errorMsg = `agent runtime ${runtimeId} failed. status: ${status}, statusReason: ${runtime.statusReason || "Unknown error"}`;
          logger.error(errorMsg);
          throw new Error(errorMsg);
        } else if (status === "CREATING" || status === "UPDATING") {
          logger.info(`agent runtime ${runtimeId} is ${status}, waiting...`);
        } else {
          logger.info(
            `agent runtime ${runtimeId} status is ${status}, waiting...`,
          );
        }
      } catch (e) {
        if (e.message && e.message.includes("failed. status:")) {
          throw e;
        }
        logger.debug(`failed to get agent runtime status: ${e.message}`);
      }

      await sleep(intervalMill);
    }

    throw new Error(
      `agent runtime ${runtimeId} is not ready in ${timeoutMill / 60 / 1000} minutes`,
    );
  }

  private async waitForEndpointsReady(runtimeId: string) {
    const logger = GLogger.getLogger();
    const timeoutMill = 5 * 60 * 1000;
    const intervalMill = 3 * 1000;
    const eol = Date.now() + timeoutMill;

    while (Date.now() < eol) {
      const endpoints = await this.listEndpoints(runtimeId);
      if (endpoints && endpoints.length > 0) {
        const failedEndpoints = endpoints.filter(
          (ep) =>
            ep.status === "FAILED" ||
            ep.status === "CREATE_FAILED" ||
            ep.status === "UPDATE_FAILED" ||
            ep.status === "DELETE_FAILED",
        );
        if (failedEndpoints.length > 0) {
          const failedNames = failedEndpoints
            .map((ep) => ep.agentRuntimeEndpointName)
            .join(", ");
          throw new Error(
            `endpoint(s) failed: ${failedNames}. status: ${failedEndpoints[0].status}, statusReason: ${failedEndpoints[0].statusReason || "Unknown error"}`,
          );
        }
        const allReady = endpoints.every(
          (ep) => ep.endpointPublicUrl && ep.endpointPublicUrl.length > 0,
        );
        if (allReady) {
          logger.info("all endpoints are ready with public URLs");
          return;
        }
        const notReady = endpoints.filter(
          (ep) => !ep.endpointPublicUrl || ep.endpointPublicUrl.length === 0,
        );
        if (notReady.length > 0) {
          logger.debug(
            `waiting for ${notReady.length} endpoint(s) to be ready: ${notReady.map((ep) => ep.agentRuntimeEndpointName).join(", ")}`,
          );
        }
      }
      await sleep(intervalMill);
    }

    logger.warn("timeout waiting for endpoints to be ready, but continuing...");
  }

  // ============================================
  // 公共方法：供外部模块使用
  // ============================================

  /**
   * 公共方法：查找 Agent Runtime 并返回 ID
   * 供外部模块（如 logs、instance、concurrency、version、endpoint）使用
   */
  public async getAgentRuntimeIdByName(): Promise<string> {
    await this.initClient("query");
    const runtimeId = await this.findAgentRuntimeByName();
    if (!runtimeId) {
      throw new Error(
        `Agent runtime ${this.agentRuntimeConfig.agentRuntimeName} not found`,
      );
    }
    return runtimeId;
  }

  /**
   * 公共方法：初始化客户端
   * 供外部模块使用
   */
  public async initializeClient(command: string) {
    await this.initClient(command);
  }
}
