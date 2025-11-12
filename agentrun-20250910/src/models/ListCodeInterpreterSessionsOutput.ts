// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { CodeInterpreterSession } from "./CodeInterpreterSession";


export class ListCodeInterpreterSessionsOutput extends $dara.Model {
  items?: CodeInterpreterSession[];
  pageNumber?: number;
  pageSize?: number;
  total?: number;
  static names(): { [key: string]: string } {
    return {
      items: 'items',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      total: 'total',
    };
  }

  static types(): { [key: string]: any } {
    return {
      items: { 'type': 'array', 'itemType': CodeInterpreterSession },
      pageNumber: 'number',
      pageSize: 'number',
      total: 'number',
    };
  }

  validate() {
    if(Array.isArray(this.items)) {
      $dara.Model.validateArray(this.items);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

