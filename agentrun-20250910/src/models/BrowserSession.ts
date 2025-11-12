// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { BrowserStreams } from "./BrowserStreams";
import { BrowserViewPort } from "./BrowserViewPort";


export class BrowserSession extends $dara.Model {
  browserId?: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  name?: string;
  sessionId?: string;
  sessionReplayartifactType?: string;
  /**
   * @remarks
   * 会话超时时间（秒）
   */
  sessionTimeoutSeconds?: number;
  status?: string;
  streams?: BrowserStreams;
  viewPort?: BrowserViewPort;
  static names(): { [key: string]: string } {
    return {
      browserId: 'browserId',
      createdAt: 'createdAt',
      lastUpdatedAt: 'lastUpdatedAt',
      name: 'name',
      sessionId: 'sessionId',
      sessionReplayartifactType: 'sessionReplayartifactType',
      sessionTimeoutSeconds: 'sessionTimeoutSeconds',
      status: 'status',
      streams: 'streams',
      viewPort: 'viewPort',
    };
  }

  static types(): { [key: string]: any } {
    return {
      browserId: 'string',
      createdAt: 'string',
      lastUpdatedAt: 'string',
      name: 'string',
      sessionId: 'string',
      sessionReplayartifactType: 'string',
      sessionTimeoutSeconds: 'number',
      status: 'string',
      streams: BrowserStreams,
      viewPort: BrowserViewPort,
    };
  }

  validate() {
    if(this.streams && typeof (this.streams as any).validate === 'function') {
      (this.streams as any).validate();
    }
    if(this.viewPort && typeof (this.viewPort as any).validate === 'function') {
      (this.viewPort as any).validate();
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

