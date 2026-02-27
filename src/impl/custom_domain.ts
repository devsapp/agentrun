import * as _ from "lodash";
import { IInputs as _IInputs } from "@serverless-devs/component-interface";
import loadComponent from "@serverless-devs/load-component";
import GLogger from "../common/logger";
import { FC3_DOMAIN_COMPONENT_NAME } from "../common/constant";
import { CustomDomainConfig } from "../interface/index";

function transformCustomDomainProps(
  local: any,
  region: string,
  functionName: string,
): any {
  const { domainName, protocol, certConfig, tlsConfig, authConfig, wafConfig } =
    local;
  let { route } = local;
  if (_.isEmpty(route)) {
    route = {};
  }
  route.functionName = functionName;
  const routeConfig = {
    routes: [route],
  };
  const _props = {
    region,
    domainName,
    protocol,
    certConfig,
    tlsConfig,
    authConfig,
    wafConfig,
    routeConfig,
  };
  return _.pickBy(_props, (value) => value !== undefined);
}

function buildDomainInputs(
  inputs: any,
  customDomainConfig: CustomDomainConfig,
  region: string,
  functionName: string,
): _IInputs {
  const domainInputs = _.cloneDeep(inputs) as _IInputs;
  const local = _.cloneDeep(customDomainConfig) as any;
  const props = transformCustomDomainProps(local, region, functionName);
  domainInputs.props = props;
  return domainInputs;
}

export async function deployCustomDomain(
  inputs: any,
  customDomainConfig: CustomDomainConfig,
  region: string,
  functionName: string,
  logger?: any,
): Promise<any> {
  const log = logger || GLogger.getLogger();
  const local = _.cloneDeep(customDomainConfig) as any;

  if (_.isEmpty(local)) {
    return undefined;
  }

  const domainInstance = await loadComponent(FC3_DOMAIN_COMPONENT_NAME, {
    logger: log,
  });

  const domainInputs = buildDomainInputs(
    inputs,
    customDomainConfig,
    region,
    functionName,
  );
  const infoInput = _.cloneDeep(domainInputs);
  let { domainName } = domainInputs.props as any;
  const deployInput = _.cloneDeep(domainInputs);

  try {
    const onlineCustomDomain = await domainInstance.info(infoInput);
    let routes = onlineCustomDomain?.routeConfig?.routes;
    if (!routes) {
      routes = [];
    }
    let found = false;
    if (routes) {
      domainName = onlineCustomDomain.domainName;
      const myRoute = local.route;
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (
          route.functionName !== functionName &&
          route.path === myRoute.path
        ) {
          throw new Error(
            `${domainName} ==> path ${route.path} is used by other function: ${route.functionName}`,
          );
        }
        if (
          route.functionName === functionName &&
          route.path === myRoute.path
        ) {
          found = true;
          if (_.isEmpty(myRoute.methods)) {
            routes[i].methods = [];
          }
        }
      }
    }
    if (!found) {
      const myRoute = _.cloneDeep(local.route);
      myRoute.functionName = functionName;
      routes.push(myRoute);
    }
    if (!(deployInput.props as any).routeConfig) {
      (deployInput.props as any).routeConfig = { routes: [] };
    }
    (deployInput.props as any).routeConfig.routes = routes;

    if (local.protocol?.toUpperCase() === "HTTP") {
      if (onlineCustomDomain.protocol?.toUpperCase() === "HTTPS") {
        (deployInput.props as any).protocol = "HTTP,HTTPS";
      } else {
        (deployInput.props as any).protocol = onlineCustomDomain.protocol;
      }
    }

    if (!_.isEmpty(local.certConfig)) {
      (deployInput.props as any).certConfig = local.certConfig;
    } else if (!_.isEmpty(onlineCustomDomain.certConfig)) {
      (deployInput.props as any).certConfig = onlineCustomDomain.certConfig;
    }

    if (!_.isEmpty(local.tlsConfig)) {
      (deployInput.props as any).tlsConfig = local.tlsConfig;
    } else if (!_.isEmpty(onlineCustomDomain.tlsConfig)) {
      (deployInput.props as any).tlsConfig = onlineCustomDomain.tlsConfig;
    }

    if (!_.isEmpty(local.authConfig)) {
      (deployInput.props as any).authConfig = local.authConfig;
    } else if (!_.isEmpty(onlineCustomDomain.authConfig)) {
      (deployInput.props as any).authConfig = onlineCustomDomain.authConfig;
    }

    if (!_.isEmpty(local.wafConfig)) {
      (deployInput.props as any).wafConfig = local.wafConfig;
    } else if (!_.isEmpty(onlineCustomDomain.wafConfig)) {
      (deployInput.props as any).wafConfig = onlineCustomDomain.wafConfig;
    }
  } catch (e) {
    log.debug(`customDomain info error: ${e.message}`);
    if (!e.message.includes("DomainNameNotFound")) {
      throw e;
    }
  }

  (deployInput.props as any).domainName = domainName;
  const id = `${functionName}/${domainName}`;
  log.info(
    `deploy customDomain ${id}, props = \n${JSON.stringify(deployInput.props, null, 2)}`,
  );
  return await domainInstance.deploy(deployInput);
}

export async function removeCustomDomain(
  inputs: any,
  customDomainConfig: CustomDomainConfig,
  region: string,
  functionName: string,
  logger?: any,
): Promise<void> {
  const log = logger || GLogger.getLogger();
  const local = _.cloneDeep(customDomainConfig) as any;

  if (_.isEmpty(local)) {
    return;
  }

  const domainInstance = await loadComponent(FC3_DOMAIN_COMPONENT_NAME, {
    logger: log,
  });

  const domainInputs = buildDomainInputs(
    inputs,
    customDomainConfig,
    region,
    functionName,
  );

  try {
    const onlineCustomDomain = await domainInstance.info(domainInputs);
    const routes = onlineCustomDomain?.routeConfig?.routes;
    if (routes) {
      const { domainName } = onlineCustomDomain;
      const myRoute = local.route;
      const qualifier = myRoute?.qualifier || "LATEST";
      let index = -1;
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (
          route.functionName === functionName &&
          route.path === myRoute?.path &&
          route.qualifier === qualifier
        ) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        routes.splice(index, 1);
        const updateInput = _.cloneDeep(domainInputs);
        updateInput.props = onlineCustomDomain;
        onlineCustomDomain.routeConfig.routes = routes;
        if (
          updateInput.args.indexOf("-y") === -1 &&
          updateInput.args.indexOf("--assume-yes") === -1
        ) {
          updateInput.args.push("-y");
        }
        if (routes.length > 0) {
          await domainInstance.deploy(updateInput);
        } else {
          await domainInstance.remove(updateInput);
        }
        log.info(
          `customDomain route for ${functionName} removed from ${domainName}`,
        );
      } else {
        log.warn(
          `{path: ${myRoute?.path}, functionName: ${functionName}} not found in custom domain ${domainName}`,
        );
      }
    }
  } catch (error) {
    log.warn(`removeCustomDomain error: ${error}`);
  }
}

export async function infoCustomDomain(
  inputs: any,
  customDomainConfig: CustomDomainConfig,
  region: string,
  functionName: string,
  logger?: any,
): Promise<any> {
  const log = logger || GLogger.getLogger();

  if (_.isEmpty(customDomainConfig)) {
    return undefined;
  }

  const domainInstance = await loadComponent(FC3_DOMAIN_COMPONENT_NAME, {
    logger: log,
  });

  const domainInputs = buildDomainInputs(
    inputs,
    customDomainConfig,
    region,
    functionName,
  );

  try {
    return await domainInstance.info(domainInputs);
  } catch (e) {
    log.debug(`infoCustomDomain error: ${e.message}`);
    return undefined;
  }
}
