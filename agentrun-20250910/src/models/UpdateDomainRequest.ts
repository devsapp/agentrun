// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { UpdateDomainInput } from "./UpdateDomainInput";


export class UpdateDomainRequest extends $dara.Model {
  body?: UpdateDomainInput;
  static names(): { [key: string]: string } {
    return {
      body: 'body',
    };
  }

  static types(): { [key: string]: any } {
    return {
      body: UpdateDomainInput,
    };
  }

  validate() {
    if(this.body && typeof (this.body as any).validate === 'function') {
      (this.body as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

