// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { RelatedResource } from "./RelatedResource";


export class CredentialListItem extends $dara.Model {
  createdAt?: string;
  credentialAuthType?: string;
  credentialId?: string;
  credentialName?: string;
  credentialSourceType?: string;
  enabled?: boolean;
  relatedResources?: RelatedResource[];
  updatedAt?: string;
  static names(): { [key: string]: string } {
    return {
      createdAt: 'createdAt',
      credentialAuthType: 'credentialAuthType',
      credentialId: 'credentialId',
      credentialName: 'credentialName',
      credentialSourceType: 'credentialSourceType',
      enabled: 'enabled',
      relatedResources: 'relatedResources',
      updatedAt: 'updatedAt',
    };
  }

  static types(): { [key: string]: any } {
    return {
      createdAt: 'string',
      credentialAuthType: 'string',
      credentialId: 'string',
      credentialName: 'string',
      credentialSourceType: 'string',
      enabled: 'boolean',
      relatedResources: { 'type': 'array', 'itemType': RelatedResource },
      updatedAt: 'string',
    };
  }

  validate() {
    if(Array.isArray(this.relatedResources)) {
      $dara.Model.validateArray(this.relatedResources);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

