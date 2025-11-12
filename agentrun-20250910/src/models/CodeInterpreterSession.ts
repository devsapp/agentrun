// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { CodeInterpreter } from "./CodeInterpreter";


export class CodeInterpreterSession extends $dara.Model {
  codeInterpreterId?: string;
  createdAt?: string;
  description?: string;
  endedAt?: string;
  execTargetUri?: string;
  id?: string;
  interpreter?: CodeInterpreter;
  name?: string;
  sessionId?: string;
  /**
   * @remarks
   * 会话超时时间（秒）
   */
  sessionTimeoutSeconds?: number;
  status?: string;
  updatedAt?: string;
  static names(): { [key: string]: string } {
    return {
      codeInterpreterId: 'codeInterpreterId',
      createdAt: 'createdAt',
      description: 'description',
      endedAt: 'endedAt',
      execTargetUri: 'execTargetUri',
      id: 'id',
      interpreter: 'interpreter',
      name: 'name',
      sessionId: 'sessionId',
      sessionTimeoutSeconds: 'sessionTimeoutSeconds',
      status: 'status',
      updatedAt: 'updatedAt',
    };
  }

  static types(): { [key: string]: any } {
    return {
      codeInterpreterId: 'string',
      createdAt: 'string',
      description: 'string',
      endedAt: 'string',
      execTargetUri: 'string',
      id: 'string',
      interpreter: CodeInterpreter,
      name: 'string',
      sessionId: 'string',
      sessionTimeoutSeconds: 'number',
      status: 'string',
      updatedAt: 'string',
    };
  }

  validate() {
    if(this.interpreter && typeof (this.interpreter as any).validate === 'function') {
      (this.interpreter as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

