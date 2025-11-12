// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class CreateGatewayResponseBody extends $dara.Model {
  gatewayId?: string;
  static names(): { [key: string]: string } {
    return {
      gatewayId: 'gatewayId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      gatewayId: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

