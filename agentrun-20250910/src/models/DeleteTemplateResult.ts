// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class DeleteTemplateResult extends $dara.Model {
  /**
   * @remarks
   * SUCCESS 为成功
   */
  code?: string;
  /**
   * @remarks
   * 唯一的请求标识符，用于问题追踪
   */
  requestId?: string;
  static names(): { [key: string]: string } {
    return {
      code: 'code',
      requestId: 'requestId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      code: 'string',
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

