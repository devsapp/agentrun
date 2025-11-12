// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListModelServicesRequest extends $dara.Model {
  modelType?: string;
  pageNumber?: number;
  pageSize?: number;
  provider?: string;
  static names(): { [key: string]: string } {
    return {
      modelType: 'modelType',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      provider: 'provider',
    };
  }

  static types(): { [key: string]: any } {
    return {
      modelType: 'string',
      pageNumber: 'number',
      pageSize: 'number',
      provider: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

