// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { StartBrowserSessionInput } from "./StartBrowserSessionInput";


export class StartBrowserSessionRequest extends $dara.Model {
  /**
   * @remarks
   * 启动浏览器会话的请求参数
   */
  body?: StartBrowserSessionInput;
  static names(): { [key: string]: string } {
    return {
      body: 'body',
    };
  }

  static types(): { [key: string]: any } {
    return {
      body: StartBrowserSessionInput,
    };
  }

  validate() {
    if(this.body && typeof (this.body as any).validate === 'function') {
      (this.body as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

