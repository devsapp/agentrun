import { IInputs } from "../interface/index";
import GLogger from "../common/logger";
import { AgentRun } from "../impl/agentrun";
import loadComponent from "@serverless-devs/load-component";

const FC3_COMPONENT_NAME = "fc3";

export default class Logs {
  private logger = GLogger.getLogger();

  constructor(private inputs: IInputs) {
    this.logger.debug(
      `Logs constructor: ${JSON.stringify(this.inputs.props)}, args: ${this.inputs.args}`,
    );
  }

  async run() {
    this.logger.info("Querying agent runtime logs via FC3...");

    // 1. 获取 Agent Runtime ID
    const agentRunObj = new AgentRun(this.inputs, "logs");
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

    this.logger.debug(`FC3 logs inputs: ${JSON.stringify(fc3Inputs, null, 2)}`);

    // 4. 加载并调用 FC3 组件的 logs 命令
    const fc3Component = await loadComponent(FC3_COMPONENT_NAME, {
      logger: this.logger,
    });

    this.logger.info(
      `Delegating to FC3 logs command for function: ${functionName}`,
    );
    return await fc3Component.logs(fc3Inputs);
  }
}
