// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class CodeInterpreterSessionSummary extends $dara.Model {
  codeInterpreterId?: string;
  createdAt?: string;
  name?: string;
  sessionId?: string;
  status?: string;
  static names(): { [key: string]: string } {
    return {
      codeInterpreterId: 'codeInterpreterId',
      createdAt: 'createdAt',
      name: 'name',
      sessionId: 'sessionId',
      status: 'status',
    };
  }

  static types(): { [key: string]: any } {
    return {
      codeInterpreterId: 'string',
      createdAt: 'string',
      name: 'string',
      sessionId: 'string',
      status: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

