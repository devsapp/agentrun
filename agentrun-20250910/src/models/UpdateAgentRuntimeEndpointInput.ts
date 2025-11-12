// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { RoutingConfiguration } from "./RoutingConfiguration";


export class UpdateAgentRuntimeEndpointInput extends $dara.Model {
  /**
   * @example
   * production-endpoint
   */
  agentRuntimeEndpointName?: string;
  /**
   * @example
   * Updated endpoint configuration
   */
  description?: string;
  /**
   * @remarks
   * 智能体运行时端点的路由配置，支持多版本权重分配
   * 
   * @example
   * {}
   */
  routingConfiguration?: RoutingConfiguration;
  /**
   * @example
   * production,customer-service
   */
  tags?: string[];
  /**
   * @remarks
   * 智能体运行时的目标版本
   * 
   * @example
   * LATEST
   */
  targetVersion?: string;
  static names(): { [key: string]: string } {
    return {
      agentRuntimeEndpointName: 'agentRuntimeEndpointName',
      description: 'description',
      routingConfiguration: 'routingConfiguration',
      tags: 'tags',
      targetVersion: 'targetVersion',
    };
  }

  static types(): { [key: string]: any } {
    return {
      agentRuntimeEndpointName: 'string',
      description: 'string',
      routingConfiguration: RoutingConfiguration,
      tags: { 'type': 'array', 'itemType': 'string' },
      targetVersion: 'string',
    };
  }

  validate() {
    if(this.routingConfiguration && typeof (this.routingConfiguration as any).validate === 'function') {
      (this.routingConfiguration as any).validate();
    }
    if(Array.isArray(this.tags)) {
      $dara.Model.validateArray(this.tags);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

