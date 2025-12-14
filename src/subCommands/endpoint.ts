import { parseArgv } from "@serverless-devs/utils";
import { IInputs } from "../interface";
import GLogger from "../common/logger";
import _ from "lodash";
import { AgentRun } from "../impl/agentrun";
import {
  CreateAgentRuntimeEndpointRequest,
  CreateAgentRuntimeEndpointInput,
  UpdateAgentRuntimeEndpointRequest,
  UpdateAgentRuntimeEndpointInput,
  ListAgentRuntimeEndpointsRequest,
  RoutingConfiguration,
  VersionWeight,
} from "@alicloud/agentrun20250910";
import chalk from "chalk";
import { promptForConfirmOrDetails } from "../utils/inquire";

const COMMANDS = ["list", "get", "publish", "remove"];

export default class Endpoint {
  readonly subCommand: string;
  private logger = GLogger.getLogger();
  private agentRunObj: AgentRun;
  private endpointName?: string;
  private targetVersion?: string; // 主版本（默认流量）
  private canaryVersion?: string; // 灰度版本
  private description?: string;
  private weight?: number; // 灰度权重
  private yes: boolean;

  constructor(readonly inputs: IInputs) {
    const {
      "endpoint-name": endpointName,
      "target-version": targetVersion,
      "canary-version": canaryVersion, // ✅ 新增灰度版本参数
      description,
      weight,
      "assume-yes": yes,
      _: subCommands,
    } = parseArgv(inputs.args, {
      alias: { "assume-yes": "y" },
      boolean: ["y"],
      string: ["endpoint-name", "target-version", "canary-version", "description"],
      number: ["weight"],
    });

    const subCommand = _.get(subCommands, "[0]");
    if (!subCommand || !COMMANDS.includes(subCommand)) {
      throw new Error(
        `Command "${subCommand}" not found. Please use "s endpoint list|get|publish|remove"`,
      );
    }

    this.subCommand = subCommand;
    this.endpointName = endpointName;
    this.targetVersion = targetVersion;
    this.canaryVersion = canaryVersion;
    this.description = description;
    this.weight = weight;
    this.yes = !!yes;
    this.agentRunObj = new AgentRun(inputs, "endpoint");

    // ✅ 参数校验
    if (this.weight !== undefined && !this.canaryVersion) {
      throw new Error(
        "--canary-version is required when --weight is specified. " +
        "Example: --target-version 2 --canary-version 1 --weight 0.2 " +
        "(80% traffic to v2, 20% to v1)"
      );
    }

    if (this.canaryVersion && this.weight === undefined) {
      throw new Error(
        "--weight is required when --canary-version is specified. " +
        "Specify a value between 0.0 and 1.0"
      );
    }

    this.logger.debug(
      `Endpoint constructor: subCommand=${this.subCommand}, ` +
      `endpointName=${this.endpointName}, targetVersion=${this.targetVersion}, ` +
      `canaryVersion=${this.canaryVersion}, weight=${this.weight}`,
    );
  }

  async list() {
    this.logger.info("Listing agent runtime endpoints...");

    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    await this.agentRunObj.initializeClient("endpoint-list");

    const listRequest = new ListAgentRuntimeEndpointsRequest({
      pageNumber: 1,
      pageSize: 100,
    });

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.listAgentRuntimeEndpoints(
          runtimeId,
          listRequest,
        );

      if (result.statusCode !== 200) {
        this.logger.error(
          `List endpoints failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to list endpoints`);
      }

      const endpoints = result.body?.data?.items || [];
      this.logger.info(
        chalk.green(`Found ${endpoints.length} endpoint(s)\n`),
      );

      if (endpoints.length === 0) {
        this.logger.info("No endpoints found. Use 's endpoint publish' to create one.");
        return [];
      }

      const formattedEndpoints = endpoints.map((ep: any) => {
        const weights = ep.routingConfiguration?.versionWeights || [];
        let trafficInfo = `100% → ${ep.targetVersion || 'LATEST'}`;
        
        if (weights.length > 0) {
          const canaryInfo = weights
            .map((w: any) => `${(w.weight * 100).toFixed(0)}% → v${w.version}`)
            .join(", ");
          const mainPercent = 100 - weights.reduce((sum: number, w: any) => sum + (w.weight * 100), 0);
          trafficInfo = `${mainPercent.toFixed(0)}% → ${ep.targetVersion || 'LATEST'}, ${canaryInfo}`;
        }

        return {
          name: ep.agentRuntimeEndpointName,
          url: ep.endpointPublicUrl || "-",
          traffic: trafficInfo,
          status: ep.status || "-",
          description: ep.description || "-",
        };
      });

      this.logger.output(formattedEndpoints);

      return formattedEndpoints;
    } catch (error) {
      this.logger.error(`Failed to list endpoints: ${error.message}`);
      throw error;
    }
  }

  async get() {
    if (!this.endpointName) {
      throw new Error("--endpoint-name is required for get command");
    }

    this.logger.info(`Getting endpoint: ${this.endpointName}...`);

    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    await this.agentRunObj.initializeClient("endpoint-get");

    const endpoints = await this.listEndpointsInternal(runtimeId);
    const endpoint = endpoints?.find(
      (ep: any) => ep.agentRuntimeEndpointName === this.endpointName,
    );

    if (!endpoint) {
      throw new Error(`Endpoint ${this.endpointName} not found`);
    }

    this.logger.info(chalk.green(`✅ Endpoint details:\n`));

    // ✅ 格式化流量分配信息
    let trafficInfo = `100% → ${endpoint.targetVersion || 'LATEST'}`;
    const weights = endpoint.routingConfiguration?.versionWeights || [];
    if (weights.length > 0) {
      const canaryInfo = weights
        .map((w: any) => `${(w.weight * 100).toFixed(0)}% → v${w.version}`)
        .join(", ");
      const mainPercent = 100 - weights.reduce((sum: number, w: any) => sum + (w.weight * 100), 0);
      trafficInfo = `${mainPercent.toFixed(0)}% → ${endpoint.targetVersion || 'LATEST'}, ${canaryInfo}`;
    }

    const output = {
      id: endpoint.agentRuntimeEndpointId || "-",
      arn: endpoint.agentRuntimeEndpointArn || "-",
      name: endpoint.agentRuntimeEndpointName || "-",
      url: endpoint.endpointPublicUrl || "-",
      targetVersion: endpoint.targetVersion || "LATEST",
      traffic: trafficInfo,
      status: endpoint.status || "-",
      description: endpoint.description || "-",
      routingConfig: endpoint.routingConfiguration || null,
    };

    this.logger.output(output);

    return output;
  }

  async publish() {
    if (!this.endpointName) {
      throw new Error("--endpoint-name is required for publish command");
    }

    this.logger.info(`Publishing endpoint: ${this.endpointName}...`);

    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    await this.agentRunObj.initializeClient("endpoint-publish");

    const endpoints = await this.listEndpointsInternal(runtimeId);
    const existingEndpoint = endpoints?.find(
      (ep: any) => ep.agentRuntimeEndpointName === this.endpointName,
    );

    if (existingEndpoint) {
      this.logger.info(
        `Endpoint ${this.endpointName} already exists, updating...`,
      );
      return await this.updateEndpoint(
        runtimeId,
        existingEndpoint.agentRuntimeEndpointId,
      );
    } else {
      this.logger.info(`Creating new endpoint ${this.endpointName}...`);
      return await this.createEndpoint(runtimeId);
    }
  }

  async remove() {
    if (!this.endpointName) {
      throw new Error("--endpoint-name is required for remove command");
    }

    if (!this.yes) {
      const confirmed = await promptForConfirmOrDetails(
        `Are you sure you want to delete endpoint ${this.endpointName}?`,
      );
      if (!confirmed) {
        this.logger.info("Cancelled");
        return;
      }
    }

    this.logger.info(`Removing endpoint: ${this.endpointName}...`);

    const runtimeId = await this.agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Agent Runtime ID: ${runtimeId}`);

    await this.agentRunObj.initializeClient("endpoint-remove");

    const endpoints = await this.listEndpointsInternal(runtimeId);
    const endpoint = endpoints?.find(
      (ep: any) => ep.agentRuntimeEndpointName === this.endpointName,
    );

    if (!endpoint) {
      throw new Error(`Endpoint ${this.endpointName} not found`);
    }

    const endpointId = endpoint.agentRuntimeEndpointId;

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.deleteAgentRuntimeEndpoint(
          runtimeId,
          endpointId,
        );

      if (result.statusCode !== 200 && result.statusCode !== 202) {
        this.logger.error(
          `Delete endpoint failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to delete endpoint`);
      }

      this.logger.info(
        chalk.green(`✅ Endpoint ${this.endpointName} deleted successfully`),
      );
    } catch (error) {
      this.logger.error(`Failed to delete endpoint: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  private async listEndpointsInternal(runtimeId: string) {
    const listRequest = new ListAgentRuntimeEndpointsRequest({
      pageNumber: 1,
      pageSize: 100,
    });

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.listAgentRuntimeEndpoints(
          runtimeId,
          listRequest,
        );

      if (result.statusCode !== 200) {
        this.logger.warn(
          `List endpoints failed, statusCode: ${result.statusCode}`,
        );
        return [];
      }

      return result.body?.data?.items || [];
    } catch (error) {
      this.logger.warn(`List endpoints failed: ${error.message}`);
      return [];
    }
  }

  private async createEndpoint(runtimeId: string) {
    const createInput = new CreateAgentRuntimeEndpointInput({
      agentRuntimeEndpointName: this.endpointName,
      description: this.description,
      targetVersion: this.targetVersion || "LATEST", // ✅ 主版本
    });

    // ✅ 如果设置了灰度配置，添加路由配置
    if (this.canaryVersion && this.weight !== undefined) {
      const routingConfig = new RoutingConfiguration({});
      const versionWeight = new VersionWeight({
        version: this.canaryVersion, // ✅ 使用灰度版本
        weight: this.weight,
      });
      routingConfig.versionWeights = [versionWeight];
      createInput.routingConfiguration = routingConfig;

      this.logger.info(
        chalk.yellow(
          `Traffic split: ${((1 - this.weight) * 100).toFixed(0)}% → v${this.targetVersion || 'LATEST'}, ` +
          `${(this.weight * 100).toFixed(0)}% → v${this.canaryVersion}`
        )
      );
    }

    const createRequest = new CreateAgentRuntimeEndpointRequest({
      body: createInput,
    });

    this.logger.debug(
      `Creating endpoint with config: ${JSON.stringify(createInput)}`,
    );

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.createAgentRuntimeEndpoint(
          runtimeId,
          createRequest,
        );

      if (result.statusCode !== 200 && result.statusCode !== 201) {
        this.logger.error(
          `Create endpoint failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to create endpoint`);
      }

      const endpointData = result.body?.data;
      this.logger.info(
        chalk.green(
          `✅ Endpoint ${this.endpointName} created successfully\n`,
        ),
      );

      const output = {
        id: endpointData?.agentRuntimeEndpointId || "-",
        name: endpointData?.agentRuntimeEndpointName || "-",
        url: endpointData?.endpointPublicUrl || "-",
        targetVersion: endpointData?.targetVersion || "LATEST",
        status: endpointData?.status || "-",
        description: endpointData?.description || "-",
      };

      this.logger.output(output);

      return output;
    } catch (error) {
      this.logger.error(`Failed to create endpoint: ${error.message}`);
      throw error;
    }
  }

  private async updateEndpoint(runtimeId: string, endpointId: string) {
    const updateInput = new UpdateAgentRuntimeEndpointInput({
      description: this.description,
      targetVersion: this.targetVersion || "LATEST", // ✅ 主版本
    });

    // ✅ 如果设置了灰度配置，添加路由配置
    if (this.canaryVersion && this.weight !== undefined) {
      const routingConfig = new RoutingConfiguration({});
      const versionWeight = new VersionWeight({
        version: this.canaryVersion, // ✅ 使用灰度版本
        weight: this.weight,
      });
      routingConfig.versionWeights = [versionWeight];
      updateInput.routingConfiguration = routingConfig;

      this.logger.info(
        chalk.yellow(
          `Traffic split: ${((1 - this.weight) * 100).toFixed(0)}% → v${this.targetVersion || 'LATEST'}, ` +
          `${(this.weight * 100).toFixed(0)}% → v${this.canaryVersion}`
        )
      );
    }

    const updateRequest = new UpdateAgentRuntimeEndpointRequest({
      body: updateInput,
    });

    this.logger.debug(
      `Updating endpoint with config: ${JSON.stringify(updateInput)}`,
    );

    try {
      const result =
        await this.agentRunObj.agentRuntimeClient.updateAgentRuntimeEndpoint(
          runtimeId,
          endpointId,
          updateRequest,
        );

      if (result.statusCode !== 200 && result.statusCode !== 202) {
        this.logger.error(
          `Update endpoint failed, statusCode: ${result.statusCode}, requestId: ${result.body?.requestId}`,
        );
        throw new Error(`Failed to update endpoint`);
      }

      const endpointData = result.body?.data;
      this.logger.info(
        chalk.green(
          `✅ Endpoint ${this.endpointName} updated successfully\n`,
        ),
      );

      const output = {
        id: endpointData?.agentRuntimeEndpointId || "-",
        name: endpointData?.agentRuntimeEndpointName || "-",
        url: endpointData?.endpointPublicUrl || "-",
        targetVersion: endpointData?.targetVersion || "LATEST",
        status: endpointData?.status || "-",
        description: endpointData?.description || "-",
      };

      this.logger.output(output);

      return output;
    } catch (error) {
      this.logger.error(`Failed to update endpoint: ${error.message}`);
      throw error;
    }
  }
}