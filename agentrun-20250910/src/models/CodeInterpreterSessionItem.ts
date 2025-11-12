// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class CodeInterpreterSessionItem extends $dara.Model {
  codeInterpreterId?: string;
  createdAt?: string;
  sessionId?: string;
  status?: string;
  updatedAt?: string;
  static names(): { [key: string]: string } {
    return {
      codeInterpreterId: 'codeInterpreterId',
      createdAt: 'createdAt',
      sessionId: 'sessionId',
      status: 'status',
      updatedAt: 'updatedAt',
    };
  }

  static types(): { [key: string]: any } {
    return {
      codeInterpreterId: 'string',
      createdAt: 'string',
      sessionId: 'string',
      status: 'string',
      updatedAt: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

