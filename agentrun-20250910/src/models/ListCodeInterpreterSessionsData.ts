// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { CodeInterpreterSessionItem } from "./CodeInterpreterSessionItem";


export class ListCodeInterpreterSessionsData extends $dara.Model {
  maxResults?: number;
  nextToken?: string;
  pageNumber?: number;
  pageSize?: number;
  sessions?: CodeInterpreterSessionItem[];
  total?: number;
  static names(): { [key: string]: string } {
    return {
      maxResults: 'maxResults',
      nextToken: 'nextToken',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      sessions: 'sessions',
      total: 'total',
    };
  }

  static types(): { [key: string]: any } {
    return {
      maxResults: 'number',
      nextToken: 'string',
      pageNumber: 'number',
      pageSize: 'number',
      sessions: { 'type': 'array', 'itemType': CodeInterpreterSessionItem },
      total: 'number',
    };
  }

  validate() {
    if(Array.isArray(this.sessions)) {
      $dara.Model.validateArray(this.sessions);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

