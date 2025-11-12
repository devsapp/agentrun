// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListAgentRuntimeEndpointsInput extends $dara.Model {
  /**
   * @remarks
   * 按端点名称过滤
   */
  endpointName?: string;
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
   * 按状态过滤
   */
  statuses?: string[];
  /**
   * @remarks
   * 按标签过滤
   */
  tags?: string[];
  static names(): { [key: string]: string } {
    return {
      endpointName: 'endpointName',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      statuses: 'statuses',
      tags: 'tags',
    };
  }

  static types(): { [key: string]: any } {
    return {
      endpointName: 'string',
      pageNumber: 'number',
      pageSize: 'number',
      statuses: { 'type': 'array', 'itemType': 'string' },
      tags: { 'type': 'array', 'itemType': 'string' },
    };
  }

  validate() {
    if(Array.isArray(this.statuses)) {
      $dara.Model.validateArray(this.statuses);
    }
    if(Array.isArray(this.tags)) {
      $dara.Model.validateArray(this.tags);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

