// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class Sandbox extends $dara.Model {
  /**
   * @remarks
   * 沙箱创建时间
   * 
   * This parameter is required.
   */
  createdAt?: string;
  /**
   * @remarks
   * 最后更新时间
   */
  lastUpdatedAt?: string;
  sandboxArn?: string;
  /**
   * @remarks
   * This parameter is required.
   */
  sandboxId?: string;
  /**
   * @remarks
   * 沙箱空闲超时时间（秒）
   */
  sandboxIdleTimeoutSeconds?: number;
  /**
   * @remarks
   * This parameter is required.
   */
  status?: string;
  /**
   * @remarks
   * This parameter is required.
   */
  templateId?: string;
  templateName?: string;
  static names(): { [key: string]: string } {
    return {
      createdAt: 'createdAt',
      lastUpdatedAt: 'lastUpdatedAt',
      sandboxArn: 'sandboxArn',
      sandboxId: 'sandboxId',
      sandboxIdleTimeoutSeconds: 'sandboxIdleTimeoutSeconds',
      status: 'status',
      templateId: 'templateId',
      templateName: 'templateName',
    };
  }

  static types(): { [key: string]: any } {
    return {
      createdAt: 'string',
      lastUpdatedAt: 'string',
      sandboxArn: 'string',
      sandboxId: 'string',
      sandboxIdleTimeoutSeconds: 'number',
      status: 'string',
      templateId: 'string',
      templateName: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

