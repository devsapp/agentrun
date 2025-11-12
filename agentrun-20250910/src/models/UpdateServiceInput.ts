// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { AiServiceConfig } from "./AiServiceConfig";


export class UpdateServiceInput extends $dara.Model {
  aiServiceConfig?: AiServiceConfig;
  static names(): { [key: string]: string } {
    return {
      aiServiceConfig: 'aiServiceConfig',
    };
  }

  static types(): { [key: string]: any } {
    return {
      aiServiceConfig: AiServiceConfig,
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

