import { ICredentials } from "@serverless-devs/component-interface";
import GLogger from "../common/logger";

// 简化 SLS 实现，不依赖特殊的包
export default class Sls {
  static generateProjectName = (region: string, accountID: string): string =>
    `aliyun-serverless-${accountID}-${region}`;
  static generateLogstoreName = (): string => {
    return "default-logs";
  };

  private accountID: string;

  constructor(
    private region: string,
    credentials: ICredentials,
  ) {
    this.accountID = credentials.AccountID;
  }

  async deploy(): Promise<{ project: string; logstore: string }> {
    const project = Sls.generateProjectName(this.region, this.accountID);
    const logstore = Sls.generateLogstoreName();

    GLogger.getLogger().debug(
      `Auto generate SLS config: project=${project}, logstore=${logstore}`,
    );

    GLogger.getLogger().info(
      `Using auto-generated SLS config: region=${this.region}, project=${project}, logstore=${logstore}`,
    );

    return { project, logstore };
  }
}