import { Component, OnInit, ViewChild } from "@angular/core";
import { _HttpClient, ModalHelper } from "@delon/theme";
import { STComponent, STColumn, STReq, STRequestOptions, STRes, STPage, STData, STChange } from "@delon/abc/st";
import { SmsAutoReplyViewerComponent } from "./view/view.component";
import { SmsAutoReplyEditorComponent } from "./edit/edit.component";
import { format } from "date-fns";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-sms-autoReply",
  templateUrl: "./autoReply.component.html",
  styleUrls: ["./autoReply.component.less"],
})
export class SmsAutoReplyComponent implements OnInit {
  constructor(private http: _HttpClient, private dialogService: DialogService, private modal: ModalHelper) {}

  static NAME = "icc-msg-auto-response-autoReply";

  url = URLS.smsAutoReply.url;
  subject = "短信自动回复";
  msgTypes = [0];
  // 页面类型 1： 回复， 2：加黑， 3：上报
  type = "1";

  @ViewChild("st", { static: false }) st: STComponent;
  // 页码信息相关
  pi: number = 1;
  ps: number = 10;
  total: number = 0;
  // request
  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      this.pi = requestOptions.body.pi;
      this.ps = requestOptions.body.ps;
      if (requestOptions.body.params.keywordType === undefined) {
        requestOptions.body.params.keywordType = -1;
      }
      if (requestOptions.body.params.matchUserIds === undefined) {
        requestOptions.body.params.matchUserIds = [];
      }
      if (requestOptions.body.params.keyword === undefined) {
        requestOptions.body.params.keyword = "";
      }
      if (requestOptions.body.params.startDate === undefined) {
        requestOptions.body.params.startDate = "";
      }
      if (requestOptions.body.params.endDate === undefined) {
        requestOptions.body.params.endDate = "";
      }
      requestOptions.body.params.msgTypes = this.msgTypes;
      return requestOptions;
    },
  };
  // result
  res: STRes = {
    process: (data, rawData) => {
      this.total = rawData.total;
      return data;
    },
  };
  page: STPage = {};
  columns: STColumn[] = [
    {
      title: "",
      index: "id",
      type: "checkbox",
      className: "text-center",
    },
    {
      title: "关键字类型",
      index: "userId",
      render: "keywordTypeTpl",
      className: "text-center",
      fixed: "left",
      width: 130,
    },
    {
      title: "关键字",
      index: "autoMatchExtConfigs",
      render: "keywordTpl",
      className: "text-center",
    },
    {
      title: "回复内容",
      width: 182,
      render: "contentTpl",
      className: "text-center",
    },
    {
      title: {
        text: "关联账号",
        optionalHelp: "同时做接收上行内容且进行下发动作的账号",
      },
      width: 192,
      render: "tpl-userAccount",
      className: "text-center",
    },
    {
      title: "更新人",
      index: "updateUserName",
      className: "text-center",
    },
    {
      title: "更新时间",
      index: "updateTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      className: "text-center",
    },
    {
      title: "状态",
      type: "tag",
      index: "state",
      className: "text-center",
      tag: {
        1: { text: "已启用", color: "green" },
        0: { text: "已停用", color: "red" },
      },
    },
    {
      title: "操作",
      className: "text-center",
      fixed: "right",
      width: 160,
      buttons: [
        {
          text: item => (item.state === 0 ? "启用" : "停用"),
          click: (item: any) => this.confirm(item),
          acl: { ability: ["sms.autoReply.active"] },
        },
        {
          text: "编辑",
          click: (item: any) => this.edit(item),
          acl: { ability: ["sms.autoReply.edit"] },
        },
        {
          text: "删除",
          click: (item: any) => this.showModal(item, false),
          acl: { ability: ["sms.autoReply.delete"] },
        },
      ],
    },
  ];

  selectedRows: STData[] = [];
  id: any;
  isBatch: any;
  messages: any;
  linkedAccounts: any[] = [];
  account: any = "-1";

  selectAccount;
  /*searchOptions*/
  searchOptions: any = {
    type: 1,
    msgTypes: [1],
    keyword: "",
    state: -1,
    keywordTypes: {
      select: "-1",
      list: [
        { label: "全部", value: "-1" },
        { label: "账号关键字", value: "1" },
        { label: "全局关键字", value: "0" },
      ],
    },
    keywordType: "-1",
    matchUserIds: [],
    channelIds: [],
    startDate: "",
    endDate: "",
  };

  expandForm = false;

  ngOnInit() {
    setTimeout(() => {
      this.resetTableList();
    }, 0);
  }

  getLinkedAccounts() {
    this.http.get(URLS.smsAutoReplyGetAccounts.url + "/0/true/" + encodeURIComponent(this.account) + "/0").subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        this.linkedAccounts = res.data;
      }
    });
  }

  getTableList() {
    this.searchOptions.matchUserIds = [];
    if (this.selectAccount) {
      this.searchOptions.matchUserIds.push(this.selectAccount);
    }
    // 格式化日期
    this.searchOptions.startDate = this.searchOptions.startDate ? format(new Date(this.searchOptions.startDate), "yyyy-MM-dd HH:mm:ss") : "";
    this.searchOptions.endDate = this.searchOptions.endDate ? format(new Date(this.searchOptions.endDate), "yyyy-MM-dd HH:mm:ss") : "";

    this.st.reset({
      params: {
        type: this.searchOptions.type,
        msgTypes: this.searchOptions.msgTypes,
        keyword: this.searchOptions.keyword,
        state: this.searchOptions.state === -1 ? null : this.searchOptions.state,
        keywordType: this.searchOptions.keywordType,
        matchUserIds: this.searchOptions.matchUserIds,
        channelIds: this.searchOptions.channelIds,
        startDate: this.searchOptions.startDate,
        endDate: this.searchOptions.endDate,
      },
    });
  }

  resetTableList() {
    // 重置搜索条件
    this.searchOptions.keywordTypes.select = "-1";
    this.searchOptions.keywordType = "-1";
    this.searchOptions.matchUserIds = [];
    this.searchOptions.state = -1;
    this.selectAccount = null;
    this.searchOptions.keyword = "";
    this.searchOptions.startDate = "";
    this.searchOptions.endDate = "";
    // 重新加载table数据
    this.getTableList();
    this.getLinkedAccounts();
  }

  showModal(item, isBatch): void {
    if (this.selectedRows.length === 0 && isBatch) {
      this.dialogService.notification.warning(this.subject, "请先选择自动回复记录！");
      return;
    }
    if (!isBatch) {
      this.id = item.id;
    }
    this.isBatch = isBatch;
    this.messages = "是否确认删除所选数据?";
    const options = {
      confirm: () => {
        this.handleOk();
      }, // 确定绑定方法
    };
    this.dialogService.modal.confirm("请确认是否删除!", this.messages, options);
  }

  handleOk(): void {
    if (this.isBatch) {
      let ids = this.selectedRows.map(i => i.id);
      this.delete(ids);
    } else {
      this.delete([this.id]);
    }
  }

  delete(ids: number[]) {
    this.http.post(URLS.smsAutoReplyDelete.url, ids).subscribe(res => {
      if (res.status === 0) {
        const pages = Math.ceil((this.total - ids.length) / this.ps);
        const pi = this.pi > pages && pages != 0 ? pages : this.pi;
        this.st.load(pi);
        this.st.clearCheck();
        this.dialogService.notification.success(this.subject, "删除成功");
      } else {
        this.dialogService.notification.error(this.subject, "删除失败");
      }
    });
  }

  stChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        break;
      case "pi":
        this.selectedRows = [];
        break;
      case "filter":
        this.resetTableList();
        break;
    }
  }

  add() {
    this.modal.createStatic(SmsAutoReplyEditorComponent, { record: { id: 0 }, role: {} }, { size: "md" }).subscribe(() => this.resetTableList());
  }

  edit(smsAutoReply) {
    this.modal.createStatic(SmsAutoReplyEditorComponent, { record: smsAutoReply }, { size: "md" }).subscribe(() => this.resetTableList());
  }

  confirm(autoReply) {
    // 当进行停用时，需中央弹窗提示【是否停用所选记录？】
    if (autoReply.state === 1) {
      // 是否停用所选记录？
      this.messages = "是否停用所选记录？";
      const options = {
        confirm: () => {
          this.active(autoReply);
        }, // 确定绑定方法
      };
      this.dialogService.modal.confirm("请确认是否停用!", this.messages, options);
    } else {
      this.active(autoReply);
    }
  }

  active(smsAutoReply) {
    let operation;
    // '0:停用，1:启用',
    if (smsAutoReply.state === 1) {
      smsAutoReply.state = 0;
      operation = "停用";
    } else {
      smsAutoReply.state = 1;
      operation = "启用";
    }
    this.http.post(URLS.smsAutoReplyActive.url, smsAutoReply).subscribe(res => {
      if (res.status === 0) {
        this.getTableList();
        this.dialogService.notification.success(this.subject, `${operation}成功`);
      } else {
        this.dialogService.notification.error(this.subject, `${res.errorMsg}`);
      }
    });
  }

  detail(smsAutoReply) {
    this.modal.createStatic(SmsAutoReplyViewerComponent, { record: smsAutoReply }, { size: "md" }).subscribe(() => {});
  }

  searchAccount(event) {
    !event || event.trim() === "" ? (this.account = "-1") : (this.account = event);
    this.getLinkedAccounts();
  }

  // 设置开始时间为00:00:00 结束时间为23:59:59
  onOkDate() {
    if (this.searchOptions.startDate) {
      // 设置开始时间为选择日期的 00:00:00
      this.searchOptions.startDate = new Date(new Date(new Date(this.searchOptions.startDate).toLocaleDateString()).getTime());
    }
    if (this.searchOptions.endDate) {
      // 设置开始时间为选择日期的 23:59:59
      this.searchOptions.endDate = new Date(new Date(new Date(this.searchOptions.endDate).toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
    }
  }
}
