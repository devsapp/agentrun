// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { AiServiceConfig } from "./AiServiceConfig";


export class ServiceInfo extends $dara.Model {
  aiServiceConfig?: AiServiceConfig;
  createdAt?: string;
  gatewayID?: string;
  name?: string;
  serviceID?: string;
  updatedAt?: string;
  static names(): { [key: string]: string } {
    return {
      aiServiceConfig: 'aiServiceConfig',
      createdAt: 'createdAt',
      gatewayID: 'gatewayID',
      name: 'name',
      serviceID: 'serviceID',
      updatedAt: 'updatedAt',
    };
  }

  static types(): { [key: string]: any } {
    return {
      aiServiceConfig: AiServiceConfig,
      createdAt: 'string',
      gatewayID: 'string',
      name: 'string',
      serviceID: 'string',
      updatedAt: 'string',
    };
  }

  validate() {
    if(this.aiServiceConfig && typeof (this.aiServiceConfig as any).validate === 'function') {
      (this.aiServiceConfig as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

