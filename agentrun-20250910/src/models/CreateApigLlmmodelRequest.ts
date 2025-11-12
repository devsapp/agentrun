// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { CreateApigLLMModelInput } from "./CreateApigLlmmodelInput";


export class CreateApigLLMModelRequest extends $dara.Model {
  body?: CreateApigLLMModelInput;
  static names(): { [key: string]: string } {
    return {
      body: 'body',
    };
  }

  static types(): { [key: string]: any } {
    return {
      body: CreateApigLLMModelInput,
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

