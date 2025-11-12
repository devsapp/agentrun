// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListToolsRequest extends $dara.Model {
  limit?: any;
  order?: any;
  page?: any;
  sort?: any;
  toolType?: string;
  static names(): { [key: string]: string } {
    return {
      limit: 'limit',
      order: 'order',
      page: 'page',
      sort: 'sort',
      toolType: 'toolType',
    };
  }

  static types(): { [key: string]: any } {
    return {
      limit: 'any',
      order: 'any',
      page: 'any',
      sort: 'any',
      toolType: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

