import { IInputs } from "./interface/index";
import { AgentRun } from "./impl/agentrun";
import GLogger from "./common/logger";
import loadComponent from "@serverless-devs/load-component";

const FC3_COMPONENT_NAME = "fc3";

export default class ComponentAgentRun {
  protected commands: any;
  private logger: any;

  constructor({ logger }: any) {
    this.logger = logger || console;
    this.commands = {
      deploy: {
        help: {
          description: `Deploy agent runtime instance with code or container.
          
          Examples with Yaml:
            # Deploy with local code
            $ s deploy
            
            # Deploy with container
            $ s deploy
            
            # Deploy with debug mode
            $ s deploy --debug
          `,
          summary: "Deploy agent runtime instance",
          option: [],
        },
      },
      info: {
        help: {
          description: `Show agent runtime instance detailed information.
          
          Examples with Yaml:
            # Show agent runtime info
            $ s info
            
            # Show info with debug mode
            $ s info --debug
          `,
          summary: "Show agent runtime instance information",
          option: [],
        },
      },
      build: {
        help: {
          description: `Build agent runtime code package locally using FC3 component.
          
          This command will:
            - Package your code directory or zip file
            - Prepare dependencies and runtime environment
            - Generate build artifacts for deployment
          
          Examples with Yaml:
            # Build code package
            $ s build
            
            # Build with custom docker file
            $ s build --dockerfile Dockerfile
            
            # Build with debug mode
            $ s build --debug
          `,
          summary: "Build agent runtime code package",
          option: [],
        },
      },
      remove: {
        help: {
          description: `Remove agent runtime instance and all associated endpoints.
          
          This will delete:
            - Agent runtime instance
            - All endpoints associated with the runtime
            - Related configurations
          
          Examples with Yaml:
            # Remove with confirmation prompt
            $ s remove
            
            # Remove without confirmation
            $ s remove -y
            
            # Remove with debug mode
            $ s remove --debug
          `,
          summary: "Remove agent runtime instance",
          option: [
            [
              "-y, --assume-yes",
              "Assume that the answer to any question which would be asked is yes",
            ],
          ],
        },
      },
    };
  }

  public async deploy(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(`deploy ==> input: ${JSON.stringify(inputs)}`);
    const agentRunObj = new AgentRun(inputs, "deploy");
    return await agentRunObj.deploy();
  }

  public async info(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(`info ==> input: ${JSON.stringify(inputs)}`);
    const agentRunObj = new AgentRun(inputs, "info");
    return await agentRunObj.info();
  }

  public async build(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(`build ==> input: ${JSON.stringify(inputs)}`);

    // 获取配置
    const props = inputs.props || {};
    const { region, agent } = props;

    if (!agent) {
      throw new Error("agent configuration is required");
    }

    const {
      name,
      description,
      code,
      customContainerConfig,
      cpu,
      memory,
      diskSize,
      timeout,
      port,
      instanceConcurrency,
      vpcConfig,
      internetAccess,
      environmentVariables,
      role,
      logConfig,
    } = agent;

    // 构建 FC3 的输入配置
    const fc3Props: any = {
      region: region,
      functionName: name,
      description: description || `AgentRuntime: ${name}`,
      cpu: cpu || 1.0,
      memorySize: memory || 2048,
      diskSize: diskSize || 512,
      timeout: timeout || 600,
      environmentVariables: environmentVariables || {},
    };

    // 判断是代码模式还是容器模式
    if (code) {
      // 代码模式
      fc3Props.runtime = code.language || "custom";
      fc3Props.handler = "index.handler";

      // 设置代码位置
      if (code.src) {
        // 本地路径（目录或 zip 文件）
        fc3Props.code = code.src;
      } else if (code.ossBucketName && code.ossObjectName) {
        // OSS 配置
        fc3Props.code = {
          ossBucketName: code.ossBucketName,
          ossObjectName: code.ossObjectName,
        };
      } else {
        throw new Error(
          "code.src or (code.ossBucketName + code.ossObjectName) must be provided",
        );
      }

      // 命令配置
      if (code.command && code.command.length > 0) {
        fc3Props.customRuntimeConfig = {
          command: code.command,
          port: port,
        };
      } else if (port) {
        fc3Props.customRuntimeConfig = {
          port: port,
        };
      }
    } else if (customContainerConfig) {
      // 容器模式
      fc3Props.runtime = "custom-container";
      fc3Props.handler = "not-used";
      fc3Props.customContainerConfig = {
        image: customContainerConfig.image,
        command: customContainerConfig.command || [],
        entrypoint: customContainerConfig.entrypoint || [],
        port: customContainerConfig.port || port,
      };
    } else {
      throw new Error("Either code or customContainerConfig must be provided");
    }

    // VPC 配置
    if (vpcConfig) {
      fc3Props.vpcConfig = {
        vpcId: vpcConfig.vpcId,
        vSwitchIds: Array.isArray(vpcConfig.vSwitchIds)
          ? vpcConfig.vSwitchIds
          : [vpcConfig.vSwitchIds],
        securityGroupId: vpcConfig.securityGroupId,
      };
    }

    // 公网访问
    if (internetAccess !== undefined) {
      fc3Props.internetAccess = internetAccess;
    }

    // 日志配置
    if (logConfig) {
      fc3Props.logConfig = {
        project: logConfig.project,
        logstore: logConfig.logstore,
        enableRequestMetrics: true,
        enableInstanceMetrics: true,
      };
    }

    // 执行角色
    if (role) {
      fc3Props.role = role;
    }

    // 实例并发
    if (instanceConcurrency) {
      fc3Props.instanceConcurrency = instanceConcurrency;
    }

    // 构建 FC3 inputs
    const fc3Inputs: IInputs = {
      ...inputs,
      props: fc3Props,
      credentials: inputs.credentials,
      project: inputs.project,
      appName: inputs.appName,
      args: inputs.args,
      path: inputs.path,
    };

    GLogger.getLogger().debug(
      `FC3 inputs: ${JSON.stringify(fc3Inputs, null, 2)}`,
    );

    // 加载并调用 FC3 组件
    const fcComponent = await loadComponent(FC3_COMPONENT_NAME, {
      logger: this.logger,
    });
    GLogger.getLogger().info(`Building agent: ${name}`);
    const buildResult = await fcComponent.build(fc3Inputs);

    GLogger.getLogger().info("✅ Build completed successfully");
    return buildResult;
  }

  public async remove(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(`remove ==> input: ${JSON.stringify(inputs)}`);
    const agentRunObj = new AgentRun(inputs, "remove");
    return await agentRunObj.remove();
  }
}
