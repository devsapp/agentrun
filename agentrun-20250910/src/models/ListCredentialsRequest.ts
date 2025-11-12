// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';


export class ListCredentialsRequest extends $dara.Model {
  credentialAuthType?: string;
  credentialName?: string;
  /**
   * @remarks
   * This parameter is required.
   */
  credentialSourceType?: string;
  enabled?: boolean;
  pageNumber?: number;
  pageSize?: number;
  provider?: string;
  static names(): { [key: string]: string } {
    return {
      credentialAuthType: 'credentialAuthType',
      credentialName: 'credentialName',
      credentialSourceType: 'credentialSourceType',
      enabled: 'enabled',
      pageNumber: 'pageNumber',
      pageSize: 'pageSize',
      provider: 'provider',
    };
  }

  static types(): { [key: string]: any } {
    return {
      credentialAuthType: 'string',
      credentialName: 'string',
      credentialSourceType: 'string',
      enabled: 'boolean',
      pageNumber: 'number',
      pageSize: 'number',
      provider: 'string',
    };
  }

  validate() {
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

