// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListSandboxesRequest extends $dara.Model {
  /**
   * @remarks
   * 当前页码，从1开始计数
   */
  pageNumber?: number;
  /**
   * @remarks
   * 每页返回的记录数量
   */
  pageSize?: number;
  /**
   * @remarks
   * 按模板名称过滤
   */
  templateName?: string;
  static names(): { [key: string]: string } {
    return {
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      templateName: 'templateName',
    };
  }

  static types(): { [key: string]: any } {
    return {
      pageNumber: 'number',
      pageSize: 'number',
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

