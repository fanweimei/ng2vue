import { STColumn } from "@delon/abc/st";
import { ControlHelperImpl, SafeType, MsgConfHelperImpl } from "@icc/common-lib";

export class ControlHelper implements ControlHelperImpl {
  parent: MsgConfHelperImpl;
  get cfg() {
    return this.parent?.cfg;
  }

  constructor(parent: MsgConfHelperImpl) {
    this.parent = parent;
  }
  /**
   * 获取黑名单配置
   */
  get blacklistConf(): SafeType {
    return {
      list: {
        from: true,
        channel: true,
      },
      add: {
        mode: 0,
        terminalIdMaxLength: 11,
      },
    };
  }

  get autoBlacklistTypes() {
    return [
      {
        label: "账号黑名单",
        value: 0,
      },
      {
        label: "全局黑名单",
        value: 1,
      },
      {
        label: "业务模板黑名单",
        value: 2,
      },
      {
        label: "业务分类黑名单",
        value: 4,
      },
      {
        label: "渠道黑名单",
        value: 3,
      },
    ];
  }

  get autoBlacklistColumns(): STColumn[] {
    return [
      {
        title: "回复内容",
        width: 232,
        className: "text-center",
        format: (item, col, index) => {
          let content = "";
          if (item.autoRespConfigs && item.autoRespConfigs.length > 0) {
            item.autoRespConfigs.forEach(element => {
              if (element.respType === 1 && element.autoRespParams) {
                if (element.autoRespParams[0] && element.autoRespParams[0].content) {
                  content = element.autoRespParams[0].content;
                }
              }
            });
          }
          return content || "-";
        },
      },
      {
        title: {
          text: "关联账号",
          optionalHelp: "同时做接收上行内容且进行下发动作的账号",
        },
        default: "-",
        className: "text-center",
        width: 132,
        format: (item, col, index) => (item.userAccount == null || item.userAccount.length == 0 ? "-" : item.userAccount),
      },
    ];
  }

  getReplyContent(item): string {
    let rc;
    item.autoRespConfigs.forEach(autoRespConfig => {
      if (autoRespConfig.respType === 1) {
        rc = autoRespConfig.autoRespParams[0].content;
      }
    });
    return rc || "";
  }

  get accountOption() {
    return {
      title: "关联账号",
      format: val => {
        return { matchUserIds: val ? [val] : [] };
      },
    };
  }

  get autoBlackEditCompOptions() {
    return {
      accountName: "关联账号",
      hasReplayContent: true,
      replayContentLen: 982,
      hasAccountBlack: true,
    };
  }
}
