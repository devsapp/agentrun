// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListAgentRuntimeVersionsInput extends $dara.Model {
  /**
   * @remarks
   * 页码
   */
  pageNumber?: number;
  /**
   * @remarks
   * 每页记录数
   */
  pageSize?: number;
  /**
   * @remarks
   * 按标签过滤
   */
  tags?: string[];
  static names(): { [key: string]: string } {
    return {
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      tags: 'tags',
    };
  }

  static types(): { [key: string]: any } {
    return {
      pageNumber: 'number',
      pageSize: 'number',
      tags: { 'type': 'array', 'itemType': 'string' },
    };
  }

  validate() {
    if(Array.isArray(this.tags)) {
      $dara.Model.validateArray(this.tags);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

