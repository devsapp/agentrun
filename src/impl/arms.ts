import { ICredentials } from "@serverless-devs/component-interface";
import { Config } from "@alicloud/openapi-client";
import GLogger from "../common/logger";
import Arms20210422, {
  DescribeDispatchRuleRequest,
} from "@alicloud/arms20190808";
import * as $Util from "@alicloud/tea-util";

export default class Arms {
  readonly client: Arms20210422;

  constructor(region: string, credentials: ICredentials) {
    const config = new Config({
      accessKeyId: credentials.AccessKeyID,
      accessKeySecret: credentials.AccessKeySecret,
      securityToken: credentials.SecurityToken,
      endpoint: `arms.${region}.aliyuncs.com`,
      regionId: region,
      readTimeout: 60000,
      connectTimeout: 5000,
    });
    GLogger.getLogger().debug(
      `Init arms client with config: ${JSON.stringify(config)}`,
    );
    this.client = new Arms20210422(config);
  }

  async DescribeTraceLicenseKey() {
    const request = new DescribeDispatchRuleRequest({});
    GLogger.getLogger().debug(
      `DescribeTraceLicenseKey request: ${JSON.stringify(request)}`,
    );
    let runtime = new $Util.RuntimeOptions({});
    const response = await this.client.describeTraceLicenseKeyWithOptions(
      request,
      runtime,
    );
    GLogger.getLogger().debug(
      "DescribeTraceLicenseKey response: %j",
      JSON.stringify(response),
    );
    return response.body.licenseKey;
  }
}
