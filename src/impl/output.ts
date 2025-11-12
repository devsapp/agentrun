export class AgentRuntimeOutput {
  agent: {
    id: string;
    arn: string;
    name: string;
    version?: string;
    description?: string;
    artifactType: string;
    status?: string;
    resources: {
      cpu: number;
      memory: number;
      port: number;
    };
    timestamps: {
      createdAt?: string;
      lastUpdatedAt?: string;
    };
    region: string;
    endpoints?: Array<{
      id: string;
      arn: string;
      name: string;
      url?: string;
      version?: string;
      status?: string;
      description?: string;
      routingConfig?: {
        weights?: Array<{
          version: string;
          weight: number;
        }>;
      };
    }>;
  };
}
