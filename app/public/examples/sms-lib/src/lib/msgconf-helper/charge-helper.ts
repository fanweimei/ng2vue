import { ChargeHelperImpl, MsgConfHelperImpl } from '@icc/common-lib';

export class ChargeHelper implements ChargeHelperImpl {

  parent: MsgConfHelperImpl;

  isSupportCharge = true;

  isSupportChargeRate = true;

  get cfg() {
    return this.parent?.cfg;
  }

  constructor(parent: MsgConfHelperImpl) {
    this.parent = parent;
  }

}
