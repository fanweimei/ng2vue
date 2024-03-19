import { Component, OnInit, ViewChild } from "@angular/core";
import { STComponent, STColumn, STReq, STRequestOptions, STRes, STPage, STData } from "@delon/abc/st";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-channel-change-history",
  templateUrl: "./channel-switch-history.component.html",
  styleUrls: ["./channel-switch-history.component.less"],
})
export class ChannelSwitchHistoryComponent implements OnInit {
  url = URLS.channelSwitchHistory.url;
  subject = "切换历史";

  static NAME = "icc-msg-channel-change-history";

  @ViewChild("st", { static: false }) st: STComponent;
  columns: STColumn[] = [
    // { title: '', index: 'id', type: 'checkbox' },
    {
      title: "切换前渠道名称",
      fixed: "left",
      width: 140,
      index: "preChannelName",
      className: "text-center",
    },
    {
      title: "切换前渠道号",
      width: 140,
      index: "preChannelNum",
      className: "text-center",
    },
    {
      title: "切换前渠道商",
      width: 140,
      index: "preChannelProviderName",
      className: "text-center",
    },
    {
      title: "切换后渠道名称",
      width: 140,
      index: "afterChannelName",
      className: "text-center",
    },
    {
      title: "切换后渠道号",
      width: 140,
      index: "afterChannelNum",
      className: "text-center",
    },
    {
      title: "切换后渠道商",
      width: 140,
      index: "afterChannelProviderName",
      className: "text-center",
    },
    {
      // 原来叫切换原因。需求改动，多了个手动切换原因，故改名。
      title: "切换类型",
      width: 140,
      index: "switchReason",
      className: "text-center",
      format: (item: STData, col: STColumn, index: number) => this.getReason(item),
    },
    {
      title: "切换原因",
      width: 200,
      index: "manualSwitchReason",
      render: "templ-manualSwitchReason",
      className: "text-center",
    },
    {
      title: "生效时间",
      width: 200,
      index: "effectiveTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      className: "text-center",
    },
  ];

  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      if (requestOptions.body.params.preChannelName === undefined) {
        requestOptions.body.params.preChannelName = "";
      }
      if (requestOptions.body.params.afterChannelName === undefined) {
        requestOptions.body.params.afterChannelName = "";
      }
      if (requestOptions.body.params.preChannelNum === undefined) {
        requestOptions.body.params.preChannelNum = "";
      }
      if (requestOptions.body.params.afterChannelNum === undefined) {
        requestOptions.body.params.afterChannelNum = "";
      }
      if (requestOptions.body.params.switchReason === undefined) {
        requestOptions.body.params.switchReason = "-2";
      }

      return requestOptions;
    },
  };
  res: STRes = {};
  page: STPage = {};

  selectedRows: STData[] = [];
  id: any;
  isBatch: any;
  messages: any;

  /*searchOptions*/
  searchOptions: any = {
    preChannelName: "",
    afterChannelName: "",
    preChannelNum: "",
    afterChannelNum: "",
    switchReason: {
      select: "-2",
      list: [
        { label: "全部", value: "-2" },
        { label: "断连恢复", value: "-1" },
        { label: "运营商断连", value: "0" },
        { label: "识别批次成功率", value: "1" },
        { label: "识别错误码", value: "2" },
        { label: "人工切换", value: "3" },
      ],
    },
  };

  expandForm = false;

  ngOnInit() {
    setTimeout(() => {
      this.resetTableList();
    }, 0);
  }

  getTableList() {
    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        preChannelName: this.searchOptions.preChannelName,
        afterChannelName: this.searchOptions.afterChannelName,
        preChannelNum: this.searchOptions.preChannelNum,
        afterChannelNum: this.searchOptions.afterChannelNum,
        switchReason: this.searchOptions.switchReason.select,
      },
    });
  }

  resetTableList() {
    // 重置搜索条件
    this.searchOptions.preChannelName = "";
    this.searchOptions.afterChannelName = "";
    this.searchOptions.preChannelNum = "";
    this.searchOptions.afterChannelNum = "";
    this.searchOptions.switchReason.select = "-2";
    // 重新加载table数据
    this.getTableList();
  }

  // { label: '运营商断连', value: '0' },
  // { label: '识别批次成功率', value: '1' },
  // { label: '识别错误码', value: '2' },
  getReason(item) {
    let index = item.switchReason;
    if (index === 0) {
      return "运营商断连";
    } else if (index === 1) {
      return "识别批次成功率";
    } else if (index === 2) {
      return "识别错误码";
    } else if (index === 3) {
      return "人工切换";
    } else if (index === -1) {
      return "断连恢复";
    } else {
      return "";
    }
  }
}
