import {
  AvatarConfiguration,
  StatusIndicatorConfiguration,
  DataItemStyle,
  InputData,
} from "../../../Shared";

/**
 * @class DataItemConfiguration
 * @description DataItemConfiguration class is used for defining the DataItem templates.
 * @param {Object} inputData
 * @param {Boolean} isActive
 */
class DataItemConfiguration {
  constructor({
    inputData = new InputData({}),
    style = new DataItemStyle({}),
    avatarConfiguration = new AvatarConfiguration({}),
    statusIndicatorConfiguration = new StatusIndicatorConfiguration({}),
  }) {
    this.inputData = new InputData(inputData ?? {});
    this.style = new DataItemStyle(style ?? {});
    this.avatarConfiguration = new AvatarConfiguration(
      avatarConfiguration ?? {}
    );
    this.statusIndicatorConfiguration = new StatusIndicatorConfiguration(
      statusIndicatorConfiguration ?? {}
    );
  }
}

export { DataItemConfiguration };
