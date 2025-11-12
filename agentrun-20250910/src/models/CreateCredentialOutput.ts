// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class CreateCredentialOutput extends $dara.Model {
  createdAt?: string;
  credentialId?: string;
  static names(): { [key: string]: string } {
    return {
      createdAt: 'createdAt',
      credentialId: 'credentialId',
    };
  }

  static types(): { [key: string]: any } {
    return {
      createdAt: 'string',
      credentialId: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

