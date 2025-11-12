// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { ModelInfoConfig } from "./ModelInfoConfig";
import { NetworkConfiguration } from "./NetworkConfiguration";
import { ProviderSettings } from "./ProviderSettings";


export class ModelService extends $dara.Model {
  createdAt?: string;
  credentialId?: string;
  description?: string;
  lastUpdatedAt?: string;
  modeServiceld?: string;
  modelInfoConfigs?: ModelInfoConfig[];
  modelServiceName?: string;
  modelType?: string;
  networkConfiguration?: NetworkConfiguration;
  provider?: string;
  providerSettings?: ProviderSettings;
  status?: string;
  static names(): { [key: string]: string } {
    return {
      createdAt: 'createdAt',
      credentialId: 'credentialId',
      description: 'description',
      lastUpdatedAt: 'lastUpdatedAt',
      modeServiceld: 'modeServiceld',
      modelInfoConfigs: 'modelInfoConfigs',
      modelServiceName: 'modelServiceName',
      modelType: 'modelType',
      networkConfiguration: 'networkConfiguration',
      provider: 'provider',
      providerSettings: 'providerSettings',
      status: 'status',
    };
  }

  static types(): { [key: string]: any } {
    return {
      createdAt: 'string',
      credentialId: 'string',
      description: 'string',
      lastUpdatedAt: 'string',
      modeServiceld: 'string',
      modelInfoConfigs: { 'type': 'array', 'itemType': ModelInfoConfig },
      modelServiceName: 'string',
      modelType: 'string',
      networkConfiguration: NetworkConfiguration,
      provider: 'string',
      providerSettings: ProviderSettings,
      status: 'string',
    };
  }

  validate() {
    if(Array.isArray(this.modelInfoConfigs)) {
      $dara.Model.validateArray(this.modelInfoConfigs);
    }
    if(this.networkConfiguration && typeof (this.networkConfiguration as any).validate === 'function') {
      (this.networkConfiguration as any).validate();
    }
    if(this.providerSettings && typeof (this.providerSettings as any).validate === 'function') {
      (this.providerSettings as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

