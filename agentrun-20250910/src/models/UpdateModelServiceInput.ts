// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { NetworkConfiguration } from "./NetworkConfiguration";
import { ProviderSettings } from "./ProviderSettings";


export class UpdateModelServiceInput extends $dara.Model {
  credentialId?: string;
  description?: string;
  networkConfiguration?: NetworkConfiguration;
  providerSettings?: ProviderSettings;
  static names(): { [key: string]: string } {
    return {
      credentialId: 'credentialId',
      description: 'description',
      networkConfiguration: 'networkConfiguration',
      providerSettings: 'providerSettings',
    };
  }

  static types(): { [key: string]: any } {
    return {
      credentialId: 'string',
      description: 'string',
      networkConfiguration: NetworkConfiguration,
      providerSettings: ProviderSettings,
    };
  }

  validate() {
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

