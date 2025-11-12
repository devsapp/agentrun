// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { SessionConfig } from "./SessionConfig";


export class StartSessionInput extends $dara.Model {
  config?: SessionConfig;
  static names(): { [key: string]: string } {
    return {
      config: 'config',
    };
  }

  static types(): { [key: string]: any } {
    return {
      config: SessionConfig,
    };
  }

  validate() {
    if(this.config && typeof (this.config as any).validate === 'function') {
      (this.config as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

