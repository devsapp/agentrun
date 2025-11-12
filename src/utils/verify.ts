import Ajv, { ErrorObject } from "ajv";

import { IInputs } from "../interface";
import { SCHEMA_FILE_PATH, SCHEMA_FILE_PATH_DELETE } from "../common/constant";
import { yellow } from "chalk";
import GLogger from "../common/logger";

export const verify = (inputs: IInputs) => {
  verifyBySchema(inputs, SCHEMA_FILE_PATH);
};

export const verifyDelete = (inputs: IInputs) => {
  verifyBySchema(inputs, SCHEMA_FILE_PATH_DELETE);
};

const verifyBySchema = function verifyBySchema(
  inputs: IInputs,
  schemaPath: string,
) {
  // 注意：ncc 或者 esbuild 之后 __dirname 会变为 dist/
  const logger = GLogger.getLogger();
  logger.debug(`Validating file path: ${schemaPath}`);
  const schema = require(schemaPath);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ajv = new Ajv({
      allErrors: true,
      strictSchema: true,
      validateSchema: true,
      verbose: true,
    });
    logger.debug(`Validate info: ${JSON.stringify(inputs.props, null, 2)}`);
    const valid = ajv.validate(schema, inputs.props);

    logger.debug(`validate status: ${valid}`);
    if (!valid) {
      logger.error(`validate error: ${JSON.stringify(ajv.errors, null, 2)}`);
      logger.error(yellow(`Valid function props error:`));
      for (const error of ajv.errors as Array<
        ErrorObject<string, Record<string, any>, unknown>
      >) {
        logger.error(
          yellow(`  ${error.instancePath}|${error.data}: ${error.message}`),
        );
      }
      logger.debug(" \n ");
      throw new Error(`validate error: ${JSON.stringify(ajv.errors, null, 2)}`);
    }
  } catch (ex) {
    logger.debug(`Validate Error: ${ex}`);
    throw ex;
  }
};
