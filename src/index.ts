import { IInputs } from "./interface/index";
import { AgentRun } from "./impl/agentrun";
import GLogger from "./common/logger";
import loadComponent from "@serverless-devs/load-component";
import Logs from "./subCommands/logs";
import Instance from "./subCommands/instance";
import Concurrency from "./subCommands/concurrency";
import Version from "./subCommands/version";
import Endpoint from "./subCommands/endpoint";

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
      logs: {
        help: {
          description: `Query agent runtime logs (powered by FC3).
          
          This command queries logs from the underlying FC function.
          
          Examples with Yaml:
            # Query recent 20 minutes logs
            $ s logs
            
            # Real-time logs (tail mode)
            $ s logs --tail
            
            # Query with time range
            $ s logs --start-time "2024-01-01 00:00:00" --end-time "2024-01-01 23:59:59"
            
            # Filter by request ID
            $ s logs --request-id 1-63f9c123-xxxx
            
            # Filter by instance ID
            $ s logs --instance-id c-63f9c123-xxxx
            
            # Search with keyword
            $ s logs --search "error"
            
            # Query only failed logs
            $ s logs --type fail
            
            # Highlight matched text
            $ s logs --search "error" --match "error"
          `,
          summary: "Query agent runtime logs",
          option: [
            ["-t, --tail", "Enable real-time log streaming"],
            ["-s, --start-time <time>", "Start time for log query"],
            ["-e, --end-time <time>", "End time for log query"],
            ["-r, --request-id <id>", "Filter by request ID"],
            ["--instance-id <id>", "Filter by instance ID"],
            ["--search <keyword>", "Search logs with keyword"],
            ["--type <type>", "Filter by type: success|fail"],
            ["--match <text>", "Highlight matched text in logs"],
          ],
        },
      },
      instance: {
        help: {
          description: `Manage agent runtime instances (powered by FC3).
          
          This command manages instances of the underlying FC function.
          
          Sub-commands:
            list    List all running instances
            exec    Execute command in a running instance
          
          Examples with Yaml:
            # List all instances
            $ s instance list
            
            # Execute command in instance
            $ s instance exec --instance-id c-xxxx --cmd "ls -lh"
            
            # Open interactive shell in instance
            $ s instance exec --instance-id c-xxxx
            
            # Use custom shell
            $ s instance exec --instance-id c-xxxx --shell /bin/sh
            
            # Execute in custom working directory
            $ s instance exec --instance-id c-xxxx --workdir /app --cmd "pwd"
          `,
          summary: "Manage agent runtime instances",
          option: [
            ["--instance-id <id>", "Instance ID for exec command"],
            ["--cmd <command>", "Command to execute in instance"],
            ["--shell <shell>", "Shell to use (default: bash)"],
            ["--workdir <dir>", "Working directory"],
            ["--no-workdir", "Don't change working directory"],
          ],
        },
        subCommands: {
          list: {
            help: {
              description: `List all running instances of the agent runtime.
              
              This will show all active instances including their IDs and status.
              
              Examples:
                $ s instance list
              `,
              summary: "List all running instances",
            },
          },
          exec: {
            help: {
              description: `Execute command in a running instance.
              
              You can run commands or open an interactive shell in any running instance.
              
              Examples:
                # Execute single command
                $ s instance exec --instance-id c-xxxx --cmd "ls -lh"
                
                # Open interactive shell
                $ s instance exec --instance-id c-xxxx
                
                # Use custom shell
                $ s instance exec --instance-id c-xxxx --shell /bin/sh
                
                # Execute in custom directory
                $ s instance exec --instance-id c-xxxx --workdir /app --cmd "pwd"
              `,
              summary: "Execute command in instance",
              option: [
                ["--instance-id <id>", "Instance ID (required)"],
                ["--cmd <command>", "Command to execute"],
                ["--shell <shell>", "Shell to use (default: bash)"],
                ["--workdir <dir>", "Working directory"],
                ["--no-workdir", "Don't change working directory"],
              ],
            },
          },
        },
      },
      concurrency: {
        help: {
          description: `Manage agent runtime concurrency configuration (powered by FC3).
          
          This command manages the reserved concurrency of the underlying FC function.
          
          Sub-commands:
            get     Get current concurrency configuration
            put     Set reserved concurrency
            remove  Remove concurrency configuration
          
          Examples with Yaml:
            # Get current concurrency configuration
            $ s concurrency get
            
            # Set reserved concurrency
            $ s concurrency put --reserved-concurrency 10
            
            # Remove concurrency configuration
            $ s concurrency remove
            
            # Remove without confirmation
            $ s concurrency remove -y
          `,
          summary: "Manage concurrency configuration",
          option: [
            ["--reserved-concurrency <number>", "Reserved concurrency value"],
            ["-y, --assume-yes", "Skip confirmation prompt"],
          ],
        },
        subCommands: {
          get: {
            help: {
              description: `Get current reserved concurrency configuration.
              
              This will display the current reserved concurrency setting.
              
              Examples:
                $ s concurrency get
              `,
              summary: "Get concurrency configuration",
            },
          },
          put: {
            help: {
              description: `Set reserved concurrency for the agent runtime.
              
              Reserved concurrency ensures a certain number of concurrent executions
              are always available for your function.
              
              Examples:
                # Set reserved concurrency to 10
                $ s concurrency put --reserved-concurrency 10
                
                # Set reserved concurrency to 50
                $ s concurrency put --reserved-concurrency 50
              `,
              summary: "Set reserved concurrency",
              option: [
                ["--reserved-concurrency <number>", "Reserved concurrency value (required)"],
              ],
            },
          },
          remove: {
            help: {
              description: `Remove reserved concurrency configuration.
              
              This will remove the reserved concurrency limit.
              
              Examples:
                # Remove with confirmation
                $ s concurrency remove
                
                # Remove without confirmation
                $ s concurrency remove -y
              `,
              summary: "Remove concurrency configuration",
              option: [
                ["-y, --assume-yes", "Skip confirmation prompt"],
              ],
            },
          },
        },
      },
      version: {
        help: {
          description: `Manage agent runtime versions.
          
          Versions allow you to publish immutable snapshots of your agent runtime.
          Each version captures the complete configuration at publish time.
          
          Sub-commands:
            list     List all published versions
            publish  Publish a new version
          
          Examples with Yaml:
            # List all versions
            $ s version list
            
            # Publish a new version
            $ s version publish --description "Production release v1.0"
            
            # Publish without description
            $ s version publish
          `,
          summary: "Manage agent runtime versions",
          option: [
            ["--description <text>", "Description for the new version"],
          ],
        },
        subCommands: {
          list: {
            help: {
              description: `List all published versions of the agent runtime.
              
              This will display all versions with their version numbers,
              descriptions, and timestamps.
              
              Examples:
                $ s version list
              `,
              summary: "List all versions",
            },
          },
          publish: {
            help: {
              description: `Publish a new immutable version.
              
              This creates a snapshot of the current agent runtime configuration.
              Once published, a version cannot be modified.
              
              Examples:
                # Publish with description
                $ s version publish --description "Production release v1.0"
                
                # Publish with auto-generated description
                $ s version publish
              `,
              summary: "Publish a new version",
              option: [
                ["--description <text>", "Version description"],
              ],
            },
          },
        },
      },
      endpoint: {
        help: {
          description: `Manage agent runtime endpoints.
          
          Endpoints are public URLs that route traffic to your agent runtime.
          They support version targeting and canary/blue-green deployments.
          
          Sub-commands:
            list     List all endpoints
            get      Get endpoint details
            publish  Create or update an endpoint
            remove   Delete an endpoint
          
          Examples with Yaml:
            # List all endpoints
            $ s endpoint list
            
            # Get endpoint details
            $ s endpoint get --endpoint-name production
            
            # Create/update endpoint pointing to LATEST
            $ s endpoint publish --endpoint-name production
            
            # Create/update endpoint pointing to specific version
            $ s endpoint publish --endpoint-name production --target-version 1 --description "Production endpoint"
            
            # Create canary endpoint with traffic split (20% to version 2)
            $ s endpoint publish --endpoint-name canary --target-version 2 --weight 0.2 --description "Canary deployment"
            
            # Remove endpoint
            $ s endpoint remove --endpoint-name staging
            
            # Remove without confirmation
            $ s endpoint remove --endpoint-name staging -y
          `,
          summary: "Manage agent runtime endpoints",
          option: [
            ["--endpoint-name <name>", "Endpoint name"],
            ["--target-version <number>", "Target version number (default: LATEST)"],
            ["--description <text>", "Endpoint description"],
            [
              "--weight <number>",
              "Traffic weight for canary deployment (0.0-1.0)",
            ],
            ["-y, --assume-yes", "Skip confirmation prompt"],
          ],
        },
        subCommands: {
          list: {
            help: {
              description: `List all endpoints for the agent runtime.
              
              This displays all configured endpoints with their URLs,
              target versions, and routing configurations.
              
              Examples:
                $ s endpoint list
              `,
              summary: "List all endpoints",
            },
          },
          get: {
            help: {
              description: `Get detailed information about a specific endpoint.
              
              This shows the endpoint's URL, version, status, and routing configuration.
              
              Examples:
                $ s endpoint get --endpoint-name production
                $ s endpoint get --endpoint-name staging
              `,
              summary: "Get endpoint details",
              option: [
                ["--endpoint-name <name>", "Endpoint name (required)"],
              ],
            },
          },
          publish: {
            help: {
              description: `Create or update an endpoint.
              
              Endpoints route traffic to specific versions of your agent runtime.
              You can configure traffic splitting for canary deployments.
              
              Examples:
                # Create/update endpoint pointing to LATEST
                $ s endpoint publish --endpoint-name production
                
                # Point to specific version
                $ s endpoint publish --endpoint-name prod-v1 --target-version 1 --description "Production v1"
                
                # Canary deployment (20% to version 2, 80% to version 1)
                $ s endpoint publish --endpoint-name canary --target-version 2 --weight 0.2
                
                # Update description only
                $ s endpoint publish --endpoint-name staging --description "Updated description"
              `,
              summary: "Create or update endpoint",
              option: [
                ["--endpoint-name <name>", "Endpoint name (required)"],
                ["--target-version <number>", "Target version (default: LATEST)"],
                ["--description <text>", "Endpoint description"],
                ["--weight <number>", "Traffic weight for canary (0.0-1.0)"],
              ],
            },
          },
          remove: {
            help: {
              description: `Delete an endpoint.
              
              This permanently removes the endpoint and its public URL.
              
              Examples:
                # Remove with confirmation
                $ s endpoint remove --endpoint-name staging
                
                # Remove without confirmation
                $ s endpoint remove --endpoint-name staging -y
              `,
              summary: "Delete an endpoint",
              option: [
                ["--endpoint-name <name>", "Endpoint name (required)"],
                ["-y, --assume-yes", "Skip confirmation prompt"],
              ],
            },
          },
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

    const props = inputs.props;
    if (!props || !props.agent) {
      throw new Error("agent configuration is required");
    }

    const { region, agent } = props;

    const {
      name,
      description,
      code,
      customContainerConfig,
      cpu,
      memory,
      port,
      instanceConcurrency,
      vpcConfig,
      internetAccess,
      environmentVariables,
      role,
      logConfig,
    } = agent;

    const fc3Props: any = {
      region: region,
      functionName: name,
      description: description || `AgentRuntime: ${name}`,
      cpu: cpu || 1.0,
      memorySize: memory || 2048,
      environmentVariables: environmentVariables || {},
    };

    const convertRuntimeToCustomRuntime = (runtime: string) => {
      if (runtime === "python3.12") {
        return "custom.debian11";
      } else return "custom.debian10";
    };

    if (code) {
      fc3Props.runtime = convertRuntimeToCustomRuntime(code.language);
      fc3Props.handler = "index.handler";

      if (code.src) {
        fc3Props.code = code.src;
      } else if (code.ossBucketName && code.ossObjectName) {
        fc3Props.code = {
          ossBucketName: code.ossBucketName,
          ossObjectName: code.ossObjectName,
        };
      } else {
        throw new Error(
          "code.src or (code.ossBucketName + code.ossObjectName) must be provided",
        );
      }

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
      fc3Props.runtime = "custom-container";
      fc3Props.handler = "not-used";
      fc3Props.customContainerConfig = {
        image: customContainerConfig.image,
        command: customContainerConfig.command || [],
      };
    } else {
      throw new Error("Either code or customContainerConfig must be provided");
    }

    if (vpcConfig) {
      fc3Props.vpcConfig = {
        vpcId: vpcConfig.vpcId,
        vSwitchIds: Array.isArray(vpcConfig.vSwitchIds)
          ? vpcConfig.vSwitchIds
          : [vpcConfig.vSwitchIds],
        securityGroupId: vpcConfig.securityGroupId,
      };
    }

    if (internetAccess !== undefined) {
      fc3Props.internetAccess = internetAccess;
    }

    if (logConfig) {
      fc3Props.logConfig = {
        project: logConfig.project,
        logstore: logConfig.logstore,
        enableRequestMetrics: true,
        enableInstanceMetrics: true,
      };
    }

    if (role) {
      fc3Props.role = role;
    }

    if (instanceConcurrency) {
      fc3Props.instanceConcurrency = instanceConcurrency;
    }

    const fc3Inputs: any = {
      props: fc3Props,
      args: inputs.args,
      getCredential: inputs.getCredential,
      userAgent: inputs.userAgent,
    };

    GLogger.getLogger().debug(
      `FC3 inputs: ${JSON.stringify(fc3Inputs, null, 2)}`,
    );

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

  public async logs(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(`logs ==> input: ${JSON.stringify(inputs)}`);
    const logs = new Logs(inputs);
    return await logs.run();
  }

  public async instance(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(
      `instance ==> input: ${JSON.stringify(inputs)}`,
    );
    const instance = new Instance(inputs);
    return await instance[instance.subCommand]();
  }

  public async concurrency(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(
      `concurrency ==> input: ${JSON.stringify(inputs)}`,
    );
    const concurrency = new Concurrency(inputs);
    return await concurrency[concurrency.subCommand]();
  }

  public async version(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(
      `version ==> input: ${JSON.stringify(inputs)}`,
    );
    const version = new Version(inputs);
    return await version[version.subCommand]();
  }

  public async endpoint(inputs: IInputs): Promise<any> {
    GLogger.setLogger(this.logger);
    GLogger.getLogger().debug(
      `endpoint ==> input: ${JSON.stringify(inputs)}`,
    );
    const endpoint = new Endpoint(inputs);
    return await endpoint[endpoint.subCommand]();
  }
}