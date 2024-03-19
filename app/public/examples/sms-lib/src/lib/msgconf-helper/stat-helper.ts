import { StatHelperImpl, SafeType, MsgConfHelperImpl, MsgAppConfig } from "@icc/common-lib";
import { STColumn, STData } from "@delon/abc/st";
import { MSG_APPTYEP } from "../shared/constant/msgType";

export class StatHelper implements StatHelperImpl {
  parent: MsgConfHelperImpl;
  get cfg() {
    return this.parent?.cfg;
  }

  constructor(parent: MsgConfHelperImpl) {
    this.parent = parent;
  }

  public getStatTableColumn(pageSign?: string): STColumn[] {
    let prefixColumns: any[] = [];
    if (pageSign === "channel-trend") {
      prefixColumns = [
        {
          title: "渠道名称",
          index: "channelName",
          width: 120,
          className: "text-center",
          fixed: "left",
        },
      ];
    } else if (pageSign === "channel-list") {
      prefixColumns = [
        {
          title: "渠道名称",
          width: 200,
          index: "channelName",
          className: "text-center",
        },
        {
          title: "渠道号",
          width: 200,
          index: "channelNum",
          className: "text-center",
        },
        {
          title: "渠道商",
          width: 200,
          index: "channelProviderName",
          className: "text-center",
        },
      ];
    } else {
      prefixColumns = [
        {
          title: "接收量",
          width: 120,
          index: "receiveCount",
          className: "text-center",
        },
        {
          title: "过滤量",
          width: 120,
          index: "filterCount",
          className: "text-center",
        },
      ];
    }
    return [
      ...prefixColumns,
      {
        title: "提交量",
        width: 120,
        index: "commitCount",
        className: "text-center",
      },
      {
        title: "提交成功量",
        width: 120,
        index: "commitCount",
        className: "text-center",
        format: (item: STData) => {
          let commitCount = item.commitCount || 0;
          let commitFailCount = item.commitFailCount || 0;
          return commitCount >= commitFailCount ? commitCount - commitFailCount + "" : "0";
        },
      },
      {
        title: "提交失败量",
        width: 120,
        index: "commitFailCount",
        className: "text-center",
      },
      {
        title: "成功量",
        width: 120,
        index: pageSign?.includes("user") || pageSign === "biztype-trend" ? "successCount" : "sendSuccessCount",
        className: "text-center",
        default: "0",
      },
      {
        title: "失败量",
        width: 120,
        index: pageSign?.includes("user") || pageSign === "biztype-trend" ? "failCount" : "sendFailCount",
        className: "text-center",
        default: "0",
      },
      {
        title: "未知量",
        width: 120,
        className: "text-center",
        format: (item, _col, index) => {
          // 提交成功量=提交量-提交失败量=接收量-过滤量-提交失败量=成功量+失败量+未知量
          let successCount = (pageSign?.includes("user") || pageSign === "biztype-trend" ? item.successCount : item.sendSuccessCount) || 0;
          let failCount = (pageSign?.includes("user") || pageSign === "biztype-trend" ? item.failCount : item.sendFailCount) || 0;
          let commitCount = item.commitCount || 0;
          let commitFailCount = item.commitFailCount || 0;
          let commitSuccessCount = commitCount - commitFailCount;
          let unknownCount = commitSuccessCount - failCount - successCount;

          if (commitSuccessCount === 0) {
            return "0";
          }

          return "" + (unknownCount >= 0 ? unknownCount : 0);
        },
      },
      {
        title: "成功率",
        width: 100,
        className: "text-center",
        format: (item: STData) => {
          if (item.sendCount === 0) {
            return "0.00%";
          }
          return (
            Number(((pageSign?.includes("user") || pageSign === "biztype-trend" ? item.successCount : item.sendSuccessCount) / item.sendCount) * 100).toFixed(
              2,
            ) + "%"
          );
        },
      },
      {
        title: "移动成功量",
        width: 120,
        index: "mobileSuccessCount",
        className: "text-center",
      },
      {
        title: "联通成功量",
        width: 120,
        index: "unicomSuccessCount",
        className: "text-center",
      },
      {
        title: "电信成功量",
        width: 120,
        index: "telecomSuccessCount",
        className: "text-center",
      },
    ];
  }
}
