import Client, {
  GetAsyncInvokeConfigRequest,
  GetFunctionCodeRequest,
  GetProvisionConfigRequest,
  GetScalingConfigRequest,
  ListTriggersRequest,
} from "@alicloud/fc20230330";
import { RuntimeOptions } from "@alicloud/tea-util";
import * as $OpenApi from "@alicloud/openapi-client";
import { ICredentials } from "@serverless-devs/component-interface";
import GLogger from "../../common/logger";

/**
 * FC3 API 客户端，用于获取函数的各种配置
 */
export class FCClient {
  private client: Client;
  private logger = GLogger.getLogger();

  constructor(region: string, credentials: ICredentials) {
    const config = new $OpenApi.Config({
      accessKeyId: credentials.AccessKeyID,
      accessKeySecret: credentials.AccessKeySecret,
      securityToken: credentials.SecurityToken,
      endpoint: `${credentials.AccountID}.${region}.fc.aliyuncs.com`,
      readTimeout: 60000,
      connectTimeout: 5000,
    });

    this.client = new Client(config);
  }

  /**
   * 获取异步调用配置
   */
  async getAsyncInvokeConfig(
    functionName: string,
    qualifier: string = "LATEST",
  ): Promise<any> {
    try {
      const request = new GetAsyncInvokeConfigRequest({ qualifier });
      const result = await this.client.getAsyncInvokeConfig(
        functionName,
        request,
      );
      const body = result.body;

      if (!body) {
        return {};
      }

      // 清理不需要的字段
      const config = { ...body };
      delete config.createdTime;
      delete config.functionArn;
      delete config.lastModifiedTime;

      // 如果 destinationConfig 为空，也删除
      if (
        config.destinationConfig &&
        Object.keys(config.destinationConfig).length === 0
      ) {
        delete config.destinationConfig;
      }

      this.logger.debug(`getAsyncInvokeConfig: ${JSON.stringify(config)}`);
      return config;
    } catch (error: any) {
      this.logger.debug(
        `Failed to get async invoke config for ${functionName}: ${error.message}`,
      );
      return {};
    }
  }

  /**
   * 获取预留配置
   */
  async getFunctionProvisionConfig(
    functionName: string,
    qualifier: string = "LATEST",
  ): Promise<any> {
    try {
      const request = new GetProvisionConfigRequest({ qualifier });
      const result = await this.client.getProvisionConfig(
        functionName,
        request,
      );
      const body = result.body;

      if (!body) {
        return {};
      }

      // 清理不需要的字段
      const config = { ...body };
      delete config.current;
      delete config.currentError;
      delete config.functionArn;
      delete config.createdTime;
      delete config.lastModifiedTime;

      this.logger.debug(
        `getFunctionProvisionConfig: ${JSON.stringify(config)}`,
      );
      return config;
    } catch (error: any) {
      this.logger.debug(
        `Failed to get provision config for ${functionName}: ${error.message}`,
      );
      return {};
    }
  }

  /**
   * 获取弹性伸缩配置
   */
  async getFunctionScalingConfig(
    functionName: string,
    qualifier: string = "LATEST",
  ): Promise<any> {
    try {
      const request = new GetScalingConfigRequest({ qualifier });
      const result = await this.client.getScalingConfig(functionName, request);
      const body = result.body;

      if (!body) {
        return {};
      }

      // 清理不需要的字段
      const config = { ...body };
      delete config.currentError;
      delete config.currentInstances;
      delete config.targetInstances;
      delete config.enableOnDemandScaling;
      delete config.functionArn;
      delete config.createdTime;
      delete config.lastModifiedTime;

      this.logger.debug(`getFunctionScalingConfig: ${JSON.stringify(config)}`);
      return config;
    } catch (error: any) {
      this.logger.debug(
        `Failed to get scaling config for ${functionName}: ${error.message}`,
      );
      return {};
    }
  }

  /**
   * 获取并发配置
   */
  async getFunctionConcurrency(functionName: string): Promise<any> {
    try {
      // @ts-ignore - SDK version compatibility
      const result = await this.client.getConcurrencyConfig(functionName);
      const body = result.body;

      if (!body) {
        return {};
      }

      // 清理不需要的字段
      const config = { ...body };
      delete config.functionArn;
      delete config.createdTime;
      delete config.lastModifiedTime;

      this.logger.debug(`getFunctionConcurrency: ${JSON.stringify(config)}`);
      return config;
    } catch (error: any) {
      this.logger.debug(
        `Failed to get concurrency config for ${functionName}: ${error.message}`,
      );
      return {};
    }
  }

  /**
   * 获取 VPC 绑定配置
   */
  async getVpcBinding(functionName: string): Promise<any> {
    try {
      // @ts-ignore - SDK version compatibility
      const result = await this.client.listVpcBindings(functionName);
      const body = result.body;

      if (!body || !body.vpcIds || body.vpcIds.length === 0) {
        return {};
      }

      const config = {
        vpcIds: body.vpcIds,
      };

      this.logger.debug(`getVpcBinding: ${JSON.stringify(config)}`);
      return config;
    } catch (error: any) {
      this.logger.debug(
        `Failed to get VPC binding for ${functionName}: ${error.message}`,
      );
      return {};
    }
  }

  /**
   * 获取函数代码下载 URL
   */
  async getFunctionCode(
    functionName: string,
    qualifier: string = "LATEST",
  ): Promise<{ url: string }> {
    try {
      const request = new GetFunctionCodeRequest({ qualifier });
      const result = await this.client.getFunctionCode(functionName, request);
      const body = result.body;

      if (!body || !body.url) {
        throw new Error(`Failed to get function code URL for ${functionName}`);
      }

      this.logger.debug(`getFunctionCode URL: ${body.url}`);
      return { url: body.url };
    } catch (error: any) {
      this.logger.error(
        `Failed to get function code for ${functionName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 获取触发器列表
   */
  async listTriggers(
    functionName: string,
    disableListRemoteEbTriggers?: string,
    disableListRemoteAlbTriggers?: string,
  ): Promise<any[]> {
    try {
      const triggers: any[] = [];
      let nextToken: string | undefined;

      do {
        const request = new ListTriggersRequest({ limit: 100, nextToken });
        const runtime = new RuntimeOptions({});
        const headers: any = {};

        if (disableListRemoteEbTriggers) {
          headers["x-fc-disable-list-remote-eb-triggers"] =
            disableListRemoteEbTriggers;
        }
        if (disableListRemoteAlbTriggers) {
          headers["x-fc-disable-list-remote-alb-triggers"] =
            disableListRemoteAlbTriggers;
        }

        const result = await this.client.listTriggersWithOptions(
          functionName,
          request,
          headers,
          runtime,
        );
        const body = result.body;

        if (!body || !body.triggers) {
          break;
        }

        for (const trigger of body.triggers) {
          // 过滤 EventBridge 触发器
          if (
            disableListRemoteEbTriggers &&
            trigger.triggerType === "eventbridge"
          ) {
            continue;
          }

          // 过滤 ALB 触发器
          if (disableListRemoteAlbTriggers && trigger.triggerType === "alb") {
            continue;
          }

          // 解析 triggerConfig
          let triggerConfig = trigger.triggerConfig;
          if (typeof triggerConfig === "string") {
            try {
              triggerConfig = JSON.parse(triggerConfig);
            } catch (e) {
              this.logger.debug(
                `Failed to parse triggerConfig for ${trigger.triggerName}`,
              );
            }
          }

          triggers.push({
            triggerName: trigger.triggerName,
            triggerType: trigger.triggerType,
            description: trigger.description,
            qualifier: trigger.qualifier,
            invocationRole: trigger.invocationRole,
            sourceArn: trigger.sourceArn,
            triggerConfig,
          });
        }

        nextToken = body.nextToken;
      } while (nextToken);

      this.logger.debug(`listTriggers: found ${triggers.length} triggers`);
      return triggers;
    } catch (error: any) {
      this.logger.debug(
        `Failed to list triggers for ${functionName}: ${error.message}`,
      );
      return [];
    }
  }
}
