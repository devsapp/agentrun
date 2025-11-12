// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class BrowserMetricsResult extends $dara.Model {
  /**
   * @remarks
   * HTTP状态码，200表示成功
   */
  code?: number;
  /**
   * @remarks
   * 浏览器的性能和运行指标
   */
  data?: any;
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
      data: 'any',
      requestId: 'string',
      success: 'boolean',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

