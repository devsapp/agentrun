// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { ListCodeInterpreterSessionsOutput } from "./ListCodeInterpreterSessionsOutput";


export class ListCodeInterpreterSessionsResult extends $dara.Model {
  /**
   * @remarks
   * HTTP状态码，200表示成功
   */
  code?: number;
  /**
   * @remarks
   * 代码解释器会话列表的详细信息
   */
  data?: ListCodeInterpreterSessionsOutput;
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
      data: ListCodeInterpreterSessionsOutput,
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

