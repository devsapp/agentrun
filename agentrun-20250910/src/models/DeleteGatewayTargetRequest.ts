// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class DeleteGatewayTargetRequest extends $dara.Model {
  targetType?: string;
  static names(): { [key: string]: string } {
    return {
      targetType: 'targetType',
    };
  }

  static types(): { [key: string]: any } {
    return {
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

