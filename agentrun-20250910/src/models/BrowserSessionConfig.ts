// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { BrowserViewPort } from "./BrowserViewPort";


export class BrowserSessionConfig extends $dara.Model {
  initialUrl?: string;
  timeout?: number;
  viewport?: BrowserViewPort;
  static names(): { [key: string]: string } {
    return {
      initialUrl: 'initialUrl',
      timeout: 'timeout',
      viewport: 'viewport',
    };
  }

  static types(): { [key: string]: any } {
    return {
      initialUrl: 'string',
      timeout: 'number',
      viewport: BrowserViewPort,
    };
  }

  validate() {
    if(this.viewport && typeof (this.viewport as any).validate === 'function') {
      (this.viewport as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

