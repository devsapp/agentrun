// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { NetworkConfiguration } from "./NetworkConfiguration";
import { ProxyConfig } from "./ProxyConfig";


export class UpdateModelProxyInput extends $dara.Model {
  credentialId?: string;
  description?: string;
  networkConfiguration?: NetworkConfiguration;
  proxyConfig?: ProxyConfig;
  static names(): { [key: string]: string } {
    return {
      credentialId: 'credentialId',
      description: 'description',
      networkConfiguration: 'networkConfiguration',
      proxyConfig: 'proxyConfig',
    };
  }

  static types(): { [key: string]: any } {
    return {
      credentialId: 'string',
      description: 'string',
      networkConfiguration: NetworkConfiguration,
      proxyConfig: ProxyConfig,
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

