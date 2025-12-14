import { parseArgv } from "@serverless-devs/utils";
import { IInputs } from "../interface/index";
import GLogger from "../common/logger";
import { AgentRun } from "../impl/agentrun";
import loadComponent from "@serverless-devs/load-component";
import _ from "lodash";

const FC3_COMPONENT_NAME = "fc3";
const COMMANDS = ["get", "put", "remove"];

export default class Concurrency {
  readonly subCommand: string;
  private logger = GLogger.getLogger();
  private opts: any;

  constructor(private inputs: IInputs) {
    this.opts = parseArgv(inputs.args, {
      alias: { "assume-yes": "y" },
      boolean: ["y"],
      string: ["reserved-concurrency", "function-name", "region"],
    });

    this.logger.debug(`Concurrency opts: ${JSON.stringify(this.opts)}`);

    const { _: subCommands } = this.opts;
    const subCommand = _.get(subCommands, "[0]");

    if (!subCommand || !COMMANDS.includes(subCommand)) {
      throw new Error(
        `Command "${subCommand}" not found. Please use "s concurrency get|put|remove"`,
      );
    }

    this.subCommand = subCommand;
    this.logger.debug(
      `Concurrency constructor: subCommand=${this.subCommand}, args=${JSON.stringify(this.inputs.args)}`,
    );
  }

  async get() {
    return await this.delegateToFC3("get");
  }

  async put() {
    return await this.delegateToFC3("put");
  }

  async remove() {
    return await this.delegateToFC3("remove");
  }

  private async delegateToFC3(command: string) {
    this.logger.info(`Executing concurrency ${command} via FC3...`);

    // 1. 获取 Agent Runtime ID
    const agentRunObj = new AgentRun(this.inputs, "concurrency");
    const runtimeId = await agentRunObj.getAgentRuntimeIdByName();
    this.logger.debug(`Found agent runtime ID: ${runtimeId}`);

    // 2. 构造 FC 函数名
    const functionName = `agentrun-${runtimeId}`;
    this.logger.debug(`Constructed FC function name: ${functionName}`);

    // 3. ✅ 修正：构造 FC3 inputs，只传递必要字段
    const fc3Inputs: any = {
      props: {
        region: this.inputs.props.region,
        functionName: functionName,
      },
      args: this.inputs.args,
      getCredential: this.inputs.getCredential,
      userAgent: this.inputs.userAgent,
      // 不传递不存在的字段：credentials, project, appName, path
    };

    this.logger.debug(
      `FC3 concurrency inputs: ${JSON.stringify(fc3Inputs, null, 2)}`,
    );

    // 4. 加载并调用 FC3 组件的 concurrency 命令
    const fc3Component = await loadComponent(FC3_COMPONENT_NAME, {
      logger: this.logger,
    });

    this.logger.info(
      `Delegating to FC3 concurrency command for function: ${functionName}`,
    );
    return await fc3Component.concurrency(fc3Inputs);
  }
}