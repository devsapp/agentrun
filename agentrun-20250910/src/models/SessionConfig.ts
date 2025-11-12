// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class SessionConfig extends $dara.Model {
  environment?: { [key: string]: string };
  timeout?: number;
  workingDirectory?: string;
  static names(): { [key: string]: string } {
    return {
      environment: 'environment',
      timeout: 'timeout',
      workingDirectory: 'workingDirectory',
    };
  }

  static types(): { [key: string]: any } {
    return {
      environment: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
      timeout: 'number',
      workingDirectory: 'string',
    };
  }

  validate() {
    if(this.environment) {
      $dara.Model.validateMap(this.environment);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

