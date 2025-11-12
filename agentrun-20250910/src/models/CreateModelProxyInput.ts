// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { NetworkConfiguration } from "./NetworkConfiguration";
import { ProxyConfig } from "./ProxyConfig";


export class CreateModelProxyInput extends $dara.Model {
  cpu?: number;
  credentialId?: string;
  description?: string;
  litellmVersion?: string;
  memory?: number;
  modelProxyName?: string;
  modelType?: string;
  networkConfiguration?: NetworkConfiguration;
  proxyConfig?: ProxyConfig;
  proxyMode?: string;
  serviceRegionId?: string;
  static names(): { [key: string]: string } {
    return {
      cpu: 'cpu',
      credentialId: 'credentialId',
      description: 'description',
      litellmVersion: 'litellmVersion',
      memory: 'memory',
      modelProxyName: 'modelProxyName',
      modelType: 'modelType',
      networkConfiguration: 'networkConfiguration',
      proxyConfig: 'proxyConfig',
      proxyMode: 'proxyMode',
      serviceRegionId: 'serviceRegionId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      cpu: 'number',
      credentialId: 'string',
      description: 'string',
      litellmVersion: 'string',
      memory: 'number',
      modelProxyName: 'string',
      modelType: 'string',
      networkConfiguration: NetworkConfiguration,
      proxyConfig: ProxyConfig,
      proxyMode: 'string',
      serviceRegionId: 'string',
    };
  }

  validate() {
    if(this.networkConfiguration && typeof (this.networkConfiguration as any).validate === 'function') {
      (this.networkConfiguration as any).validate();
    }
    if(this.proxyConfig && typeof (this.proxyConfig as any).validate === 'function') {
      (this.proxyConfig as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

