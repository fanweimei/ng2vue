import {
  ControlHelperImpl,
  StandardHelperImpl,
  MsgConfHelperImpl,
  StandardMessageHelperImpl,
  StatHelperImpl,
  ChargeHelperImpl,
  StandardBusinessHelperImpl,
  MsgConfig,
  MsgAppConfig,
  PluginType,
} from "@icc/common-lib";
import { MSG_APPTYEP } from "../shared/constant/msgType";
import { ControlHelper } from "./control-helper";
import { StandardBusinessHelper } from "./standard-business-helper";
import { StandardMessageHelper } from "./standard-message-helper";
import { StatHelper } from "./stat-helper";
import { StandardHelper } from "./standard-helper";
import { ChargeHelper } from "./charge-helper";

export class MsgConfHelper implements MsgConfHelperImpl {
  static shortUrlNotOfContent = false;

  cfg: MsgConfig;
  appTypeMap: Map<number, MsgAppConfig> = new Map();
  controlHelper: ControlHelperImpl;
  standardMessageHelper: StandardMessageHelperImpl;
  statHelper?: StatHelperImpl;
  standardBusinessHelper: StandardBusinessHelperImpl;
  standardHelper?: StandardHelperImpl;
  chargeHelper: ChargeHelperImpl;

  constructor(cfg: MsgConfig) {
    this.cfg = cfg;
    if (this.cfg.appType) {
      for (let item of this.cfg.appType) {
        this.appTypeMap.set(item.id, item);
      }
    }
    this.controlHelper = new ControlHelper(this);
    this.standardMessageHelper = new StandardMessageHelper(this);
    this.statHelper = new StatHelper(this);
    this.standardBusinessHelper = new StandardBusinessHelper(this);
    this.standardHelper = new StandardHelper(this);
    this.chargeHelper = new ChargeHelper(this);
  }

  updateApptype(pluginMap: Map<PluginType, boolean>) {
    if (pluginMap.has(PluginType.aim)) {
      return this.cfg.appType;
    }
    const index = this.cfg.appType.findIndex(item => item.id == MSG_APPTYEP.aim);
    if (index != -1) {
      this.cfg.appType.splice(index, 1);
      this.appTypeMap.delete(this.cfg.appType[index].id);
    }
  }
}
