import { ControlHelperImpl,StandardHelperImpl, MsgConfHelperImpl, TabItem } from '@icc/common-lib';

export class StandardHelper implements StandardHelperImpl {
    parent: MsgConfHelperImpl;
    get cfg() {
        return this.parent?.cfg;
    }

    constructor(parent: MsgConfHelperImpl) {
        this.parent = parent;
    }


    get getChartColor(): string {
      return "rgb(94,212,253)";
    }

    get hasDashboardPatchAuditBtn(): boolean {
      return true;
    }

    /**
     * 消息自动应答tab项
     */
    get automationResponseMenus() {
      return [
        {
          key: "autoReply",
          title: "自动回复",
          acl: "sms.autoReply",
        },
        {
          key: "autoReport",
          title: "自动上报",
          acl: "sms.autoReport",
        }
      ];
    }

}
