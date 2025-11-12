// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { BrowserSession } from "./BrowserSession";


export class BrowserSessionResult extends $dara.Model {
  /**
   * @remarks
   * HTTP状态码，200表示成功
   */
  code?: number;
  /**
   * @remarks
   * 浏览器会话的详细信息
   */
  data?: BrowserSession;
  /**
   * @remarks
   * 唯一的请求标识符，用于问题追踪
   */
  requestId?: string;
  /**
   * @remarks
   * true表示请求成功，false表示失败
   */
  success?: boolean;
  static names(): { [key: string]: string } {
    return {
      code: 'code',
      data: 'data',
      requestId: 'requestId',
      success: 'success',
    };
  }

  static types(): { [key: string]: any } {
    return {
      code: 'number',
      data: BrowserSession,
      requestId: 'string',
      success: 'boolean',
    };
  }

  validate() {
    if(this.data && typeof (this.data as any).validate === 'function') {
      (this.data as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

