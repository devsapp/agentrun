// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListApigLLMModelsRequest extends $dara.Model {
  gatewayId?: string;
  name?: string;
  pageNumber?: number;
  pageSize?: number;
  provider?: string;
  type?: string;
  static names(): { [key: string]: string } {
    return {
      gatewayId: 'gatewayId',
      name: 'name',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      provider: 'provider',
      type: 'type',
    };
  }

  static types(): { [key: string]: any } {
    return {
      gatewayId: 'string',
      name: 'string',
      pageNumber: 'number',
      pageSize: 'number',
      provider: 'string',
      type: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

