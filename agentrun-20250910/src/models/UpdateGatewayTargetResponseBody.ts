// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class UpdateGatewayTargetResponseBody extends $dara.Model {
  targetId?: string;
  static names(): { [key: string]: string } {
    return {
      targetId: 'targetId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      targetId: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

