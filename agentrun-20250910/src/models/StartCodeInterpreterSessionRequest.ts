// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { StartCodeInterpreterSessionInput } from "./StartCodeInterpreterSessionInput";


export class StartCodeInterpreterSessionRequest extends $dara.Model {
  /**
   * @remarks
   * 启动代码解释器会话的请求参数
   */
  body?: StartCodeInterpreterSessionInput;
  static names(): { [key: string]: string } {
    return {
      body: 'body',
    };
  }

  static types(): { [key: string]: any } {
    return {
      body: StartCodeInterpreterSessionInput,
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

