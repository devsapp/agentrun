// This file is auto-generated, don't edit it
import * as $dara from '@darabonba/typescript';
import { ContainerConfiguration } from "./ContainerConfiguration";
import { CredentialConfiguration } from "./CredentialConfiguration";
import { LogConfiguration } from "./LogConfiguration";
import { NetworkConfiguration } from "./NetworkConfiguration";
import { OssConfiguration } from "./OssConfiguration";


export class CreateTemplateInput extends $dara.Model {
  /**
   * @remarks
   * 容器配置，只允许基于 Browser/Code Interpreter 基础镜像的 image
   */
  containerConfiguration?: ContainerConfiguration;
  /**
   * @remarks
   * CPU资源配置（单位：核心）
   * 
   * This parameter is required.
   */
  cpu?: number;
  credentialConfiguration?: CredentialConfiguration;
  description?: string;
  environmentVariables?: { [key: string]: string };
  executionRoleArn?: string;
  logConfiguration?: LogConfiguration;
  /**
   * @remarks
   * 内存资源配置（单位：MB）
   * 
   * This parameter is required.
   */
  memory?: number;
  networkConfiguration?: NetworkConfiguration;
  ossConfiguration?: OssConfiguration;
  /**
   * @remarks
   * 沙箱存活时间（秒）
   */
  sandboxIdleTTLSeconds?: number;
  /**
   * @remarks
   * 沙箱空闲超时时间（秒）
   */
  sandboxIdleTimeoutSeconds?: number;
  /**
   * @remarks
   * 每个实例的最大并发会话数
   */
  sessionConcurrencyLimitPerInstance?: number;
  /**
   * @remarks
   * 模板配置（灵活的对象结构，根据 templateType 不同而不同）
   */
  templateConfiguration?: { [key: string]: any };
  /**
   * @remarks
   * 模板名称（要求账号唯一的）
   * 
   * This parameter is required.
   */
  templateName?: string;
  /**
   * @remarks
   * This parameter is required.
   */
  templateType?: string;
  static names(): { [key: string]: string } {
    return {
      containerConfiguration: 'containerConfiguration',
      cpu: 'cpu',
      credentialConfiguration: 'credentialConfiguration',
      description: 'description',
      environmentVariables: 'environmentVariables',
      executionRoleArn: 'executionRoleArn',
      logConfiguration: 'logConfiguration',
      memory: 'memory',
      networkConfiguration: 'networkConfiguration',
      ossConfiguration: 'ossConfiguration',
      sandboxIdleTTLSeconds: 'sandboxIdleTTLSeconds',
      sandboxIdleTimeoutSeconds: 'sandboxIdleTimeoutSeconds',
      sessionConcurrencyLimitPerInstance: 'sessionConcurrencyLimitPerInstance',
      templateConfiguration: 'templateConfiguration',
      templateName: 'templateName',
      templateType: 'templateType',
    };
  }

  static types(): { [key: string]: any } {
    return {
      containerConfiguration: ContainerConfiguration,
      cpu: 'number',
      credentialConfiguration: CredentialConfiguration,
      description: 'string',
      environmentVariables: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
      executionRoleArn: 'string',
      logConfiguration: LogConfiguration,
      memory: 'number',
      networkConfiguration: NetworkConfiguration,
      ossConfiguration: OssConfiguration,
      sandboxIdleTTLSeconds: 'number',
      sandboxIdleTimeoutSeconds: 'number',
      sessionConcurrencyLimitPerInstance: 'number',
      templateConfiguration: { 'type': 'map', 'keyType': 'string', 'valueType': 'any' },
      templateName: 'string',
      templateType: 'string',
    };
  }

  validate() {
    if(this.containerConfiguration && typeof (this.containerConfiguration as any).validate === 'function') {
      (this.containerConfiguration as any).validate();
    }
    if(this.credentialConfiguration && typeof (this.credentialConfiguration as any).validate === 'function') {
      (this.credentialConfiguration as any).validate();
    }
    if(this.environmentVariables) {
      $dara.Model.validateMap(this.environmentVariables);
    }
    if(this.logConfiguration && typeof (this.logConfiguration as any).validate === 'function') {
      (this.logConfiguration as any).validate();
    }
    if(this.networkConfiguration && typeof (this.networkConfiguration as any).validate === 'function') {
      (this.networkConfiguration as any).validate();
    }
    if(this.ossConfiguration && typeof (this.ossConfiguration as any).validate === 'function') {
      (this.ossConfiguration as any).validate();
    }
    if(this.templateConfiguration) {
      $dara.Model.validateMap(this.templateConfiguration);
    }
    super.validate();
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}

