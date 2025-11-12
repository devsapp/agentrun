// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListAgentRuntimesInput extends $dara.Model {
  /**
   * @remarks
   * 按名称过滤
   * 
   * @example
   * my-agent-runtime
   */
  agentRuntimeName?: string;
  /**
   * @remarks
   * 页码
   * 
   * @example
   * 1
   */
  pageNumber?: number;
  /**
   * @remarks
   * 每页记录数
   * 
   * @example
   * 20
   */
  pageSize?: number;
  /**
   * @remarks
   * 按状态过滤
   * 
   * @example
   * READY,CREATING
   */
  statuses?: string[];
  /**
   * @remarks
   * 按标签过滤
   * 
   * @example
   * production,ai-agent
   */
  tags?: string[];
  static names(): { [key: string]: string } {
    return {
      agentRuntimeName: 'agentRuntimeName',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      statuses: 'statuses',
      tags: 'tags',
    };
  }

  static types(): { [key: string]: any } {
    return {
      agentRuntimeName: 'string',
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

