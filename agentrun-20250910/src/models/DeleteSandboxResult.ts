// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class DeleteSandboxResult extends $dara.Model {
  /**
   * @remarks
   * SUCCESS 为成功
   */
  code?: string;
  /**
   * @remarks
   * 响应数据，可能为null
   */
  data?: any;
  /**
   * @remarks
   * 唯一的请求标识符，用于问题追踪
   */
  requestId?: string;
  static names(): { [key: string]: string } {
    return {
      code: 'code',
      data: 'data',
      requestId: 'requestId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      code: 'string',
      data: 'any',
      requestId: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

