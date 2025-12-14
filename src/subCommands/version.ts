import { parseArgv } from "@serverless-devs/utils";
import { IInputs } from "../interface";
import GLogger from "../common/logger";
import _ from "lodash";
import { AgentRun } from "../impl/agentrun";
import {
  PublishRuntimeVersionRequest,
  PublishRuntimeVersionInput,
  ListAgentRuntimeVersionsRequest,
} from "@alicloud/agentrun20250910";
import chalk from "chalk";

const COMMANDS = ["list", "publish"];

export default class Version {
  readonly subCommand: string;
  private logger = GLogger.getLogger();
  private agentRunObj: AgentRun;
  private description?: string;

  constructor(readonly inputs: IInputs) {
    const { description, _: subCommands } = parseArgv(inputs.args, {
      string: ["description"],
    });

    const subCommand = _.get(subCommands, "[0]");
    if (!subCommand || !COMMANDS.includes(subCommand)) {
      throw new Error(
        `Command "${subCommand}" not found. Please use "s version list" or "s version publish"`,
      );
    }

    this.subCommand = subCommand;
    this.description = description;
    this.agentRunObj = new AgentRun(inputs, "version");

    this.logger.debug(
      `Version constructor: subCommand=${this.subCommand}, description=${this.description}`,
    );
  }

  async list() {
    this.logger.info("Listing agent runtime versions...");

    // 获取 Agent Runtime ID
    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    // 初始化客户端
    await this.agentRunObj.initializeClient("version-list");

    // 构造请求
    const listRequest = new ListAgentRuntimeVersionsRequest({
      pageNumber: 1,
      pageSize: 100,
    });

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.listAgentRuntimeVersions(
          runtimeId,
          listRequest,
        );

      if (result.statusCode !== 200) {
        this.logger.error(
          `List versions failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to list versions`);
      }

      const versions = result.body?.data?.items || [];
      this.logger.info(
        chalk.green(`Found ${versions.length} version(s)\n`),
      );

      if (versions.length === 0) {
        this.logger.info("No versions found. Use 's version publish' to create one.");
        return [];
      }

      // 格式化输出
      const formattedVersions = versions.map((v: any) => ({
        version: v.agentRuntimeVersion,
        description: v.description || "-",
        lastUpdatedAt: v.lastUpdatedAt || "-",
        arn: v.agentRuntimeArn || "-",
      }));

      // 输出表格
      this.logger.output(formattedVersions);

      return formattedVersions;
    } catch (error) {
      this.logger.error(`Failed to list versions: ${error.message}`);
      throw error;
    }
  }

  async publish() {
    this.logger.info("Publishing new agent runtime version...");

    // 获取 Agent Runtime ID
    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    // 初始化客户端
    await this.agentRunObj.initializeClient("version-publish");

    // 构造请求
    const publishInput = new PublishRuntimeVersionInput({
      description:
        this.description || `Published at ${new Date().toISOString()}`,
    });

    const publishRequest = new PublishRuntimeVersionRequest({
      body: publishInput,
    });

    this.logger.debug(
      `Publishing version with description: ${publishInput.description}`,
    );

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.publishRuntimeVersion(
          runtimeId,
          publishRequest,
        );

      if (result.statusCode !== 200 && result.statusCode !== 201) {
        this.logger.error(
          `Publish version failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to publish version`);
      }

      const versionData = result.body?.data;
      this.logger.info(
        chalk.green(
          `✅ Version published successfully: ${versionData?.agentRuntimeVersion}`,
        ),
      );

      const output = {
        version: versionData?.agentRuntimeVersion || "-",
        description: versionData?.description || "-",
        lastUpdatedAt: versionData?.lastUpdatedAt || "-",
        arn: versionData?.agentRuntimeArn || "-",
      };

      this.logger.output(output);

      return output;
    } catch (error) {
      this.logger.error(`Failed to publish version: ${error.message}`);
      throw error;
    }
  }
}