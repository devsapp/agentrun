// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListGatewayTargetsRequest extends $dara.Model {
  pageNumber?: number;
  pageSize?: number;
  targetType?: string;
  static names(): { [key: string]: string } {
    return {
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      targetType: 'targetType',
    };
  }

  static types(): { [key: string]: any } {
    return {
      pageNumber: 'number',
      pageSize: 'number',
      targetType: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

