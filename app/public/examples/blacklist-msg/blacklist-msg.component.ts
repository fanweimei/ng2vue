/**
 * 根据需求文档修改：分为两种模型
 * （1）渠道模型相关
 * （2）渠道模型无关
 */

import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { STChange, STColumn, STData, STPage, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { ModalHelper, _HttpClient } from "@delon/theme";
import { format } from "date-fns";
import { deepCopy, deepMerge } from "@delon/util";
import { URLS } from "@shared";
import { DialogService, MessageService, MsgconfHelperService, ControlHelperImpl, treeScrollcontrl } from "@icc/common-lib";
import { NzFormatEmitEvent, NzTreeComponent, NzTreeNode, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { BlackListImportExportComponent } from "./import-export/import-export.component";
import { BlackListEditComponent2 } from "./edit/edit-channelrel/edit.component";
import { BlackListEditComponent } from "./edit/edit/edit.component";

const AppPushKey = "apppush";

enum STATE {
  ALL = -1,
  ENABLE = 1,
}

@Component({
  selector: "app-blacklist-msg",
  templateUrl: "./blacklist-msg.component.html",
  styleUrls: ["./blacklist-msg.component.less"],
})
export class BlacklistMsgComponent implements OnInit, AfterViewInit {
  @ViewChild("st", { static: false }) st: any;
  cfgs: any = {};
  // msgObj = new WechatBlacklist();
  @ViewChild("nzTreeComponent", { static: false })
  nzTreeComponent: NzTreeComponent;
  nodes: NzTreeNodeOptions[] = [];
  defaultExpandedKeys: any[] = []; // 默认展开根节点
  defaultSelectedKeys: any[] = []; // 默认选中根节点
  userEnums: any = [{ label: "全部", value: -1 }];
  businessEnums: any = [{ label: "全部", value: -1 }];
  channelEnums: any = [{ label: "全部", value: -1 }];
  bizTypeClassEnums: any = [{ label: "全部", value: -1 }];
  searchOptions: {
    channelId?;
    strategyTypes;
    handleFrom?;
    user;
    business;
    channel?;
    bizTypeClass;
    terminalId;
    dateRange;
  } = {
    channelId: "", //微信、企业微信、APPPUSH左侧树
    strategyTypes: {
      select: -1,
      list: [],
    },
    handleFrom: {
      select: -1,
      list: [],
    },
    user: {
      select: -1,
      list: this.userEnums,
    },
    business: {
      select: -1,
      list: this.businessEnums,
    },
    channel: {
      select: -1,
      list: this.channelEnums,
    },
    bizTypeClass: {
      select: -1,
      list: this.bizTypeClassEnums,
    },
    terminalId: "",
    dateRange: [],
  };
  expandForm = false;
  isOpenExport = false;
  isOpenImport = false;
  isBatchDelete = false;
  selectedRows: STData[] = [];
  blacklistConf: any = {};
  listUrl: string = "";
  columns: STColumn[] = [
    {
      title: "",
      index: "id",
      type: "checkbox",
      width: 50,
      fixed: "left",
    },
    {
      renderTitle: "title-terminal",
      index: "terminalId",
      render: "templ-terminalId",
      className: "text-center",
      width: 232,
      fixed: "left",
    },
    {
      title: "管控类型",
      className: "text-center",
      render: "templ-strategyTypeShow",
      index: "strategyTypeShow",
      width: 182,
    },
    {
      title: "来源",
      index: "handleFrom",
      className: "text-center",
      format: item => {
        let handleFormArr = ["自动加黑", "手动加黑"];
        return handleFormArr[item.handleFrom];
      },
      width: 182,
      iif: () => {
        return this.blacklistConf.list?.from;
      },
    },
    {
      title: {
        text: "关联账号",
        optionalHelp: "同时做接收上行内容且进行下发动作的账号",
      },
      index: "account",
      default: "-",
      className: "text-center",
      render: "templ-account",
      width: 132,
    },
    {
      title: "关联业务模板",
      default: "-",
      className: "text-center",
      index: "businessName",
      render: "templ-businessName",
      width: 182,
    },
    {
      title: "关联业务分类",
      default: "-",
      className: "text-center",
      index: "bizCategName",
      render: "templ-bizCategName",
      width: 182,
    },
    {
      title: "关联渠道",
      default: "-",
      className: "text-center",
      index: "channelName",
      render: "templ-channelName",
      width: 212,
      format: item => {
        return item.channelName ? item.channelName : "-";
      },
      iif: () => {
        return this.blacklistConf.list?.channel;
      },
    },
    {
      title: "备注",
      default: "-",
      className: "text-center long-text",
      index: "remark",
      render: "templ-remark",
      width: 252,
      format: item => {
        return item.remark ? item.remark : "-";
      },
      iif: () => {
        return this.blacklistConf.list?.remark;
      },
    },
    {
      title: "更新人",
      default: "-",
      className: "text-center",
      index: "modifyUserName",
      render: "templ-modifyUserName",
      width: 132,
      format: item => {
        return item.modifyUserName ? item.modifyUserName : "-";
      },
    },
    {
      title: "更新时间",
      default: "-",
      className: "text-center",
      index: "updateTime",
      width: 200,
      format: item => {
        return item.updateTime ? item.updateTime : "-";
      },
    },
  ];

  // 删除最后一页内容
  pi = 1;
  ps = 10;
  total = 0;

  req: STReq = {
    method: "POST",
    allInBody: true,
    lazyLoad: true,
    body: {
      params: {},
    },
    process: (requestOptions: STRequestOptions) => {
      this.pi = requestOptions.body.pi;
      this.ps = requestOptions.body.ps;
      return requestOptions;
    },
  };
  res: STRes = {
    process: (data, rawData) => {
      this.total = rawData.total;
      return data;
    },
  };
  page: STPage = {
    toTop: false,
  };
  hasfrom = true;

  constructor(
    private messageService: MessageService,
    private confhelperService: MsgconfHelperService,
    private router: Router,
    private http: _HttpClient,
    private dialogService: DialogService,
    private modal: ModalHelper,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const arr = location.href.split("?")[0].split("/");
    const key = arr[arr.length - 1];
    if (key == undefined) {
      this.router.navigate(["exception/404"]);
      return;
    }
    const conf: ControlHelperImpl = this.confhelperService.getControlHelperInstance(key)!;
    this.blacklistConf = deepMerge(
      {
        list: {
          from: true,
          channel: true,
          remark: true,
        },
        add: {
          mode: 0,
          terminalIdMaxLength: 50,
        },
      },
      conf?.blacklistConf || {},
    );
    const msgConfigs = this.messageService.getMessageConfigByName(key);
    if (!msgConfigs || !msgConfigs.blacklist || msgConfigs.blacklist.show === false) {
      this.router.navigate(["exception/404"]);
      return;
    }
    // console.log('key :>> ', key);
    // console.log('msgConfigs :>> ', msgConfigs);
    // 兼容设计缺陷，apppsuh发送透传消息，终端收到后取消订阅，黑名单类型就会是自动加黑
    this.hasfrom = this.blacklistConf.list?.from && (!!msgConfigs.autoBlacklist || key === AppPushKey);
    this.cfgs = deepCopy(msgConfigs);
    this.cfgs.subject = msgConfigs.zh_name;
    this.cfgs.key = key;
    this.initSearchOptions();
    // this.requestUsers();
    // this.requestBizTypes();
    // this.requestBizTypesClass();
    this.listUrl = URLS[`${this.cfgs.key}Blacklist`].url;
    if (this.cfgs.terminalId.useWithCh) {
      this.requestTreeNodes();
      this.listenTreeHeight();
    } else {
      setTimeout(() => {
        this.getTableList();
      }, 100);
    }
    // if (this.blacklistConf.list?.channel) {
    //   this.requestChannel();
    // }
  }

  ngAfterViewInit(): void {
    this.changeColumn();
  }

  changeColumn() {
    let operationColmun: any = {
      title: "操作",
      className: "text-center",
      width: 100,
      fixed: "right",
      buttons: [
        {
          text: "删除",
          pop: "是否确认删除所选记录？",
          click: (item: any) => {
            this.delete([item.id]);
          },
          acl: {
            ability: [`blacklist.${this.cfgs.key}.delete`],
          },
        },
      ],
    };
    this.columns = this.columns.concat(operationColmun);
  }

  strategyTypeChange(e) {
    switch (+e) {
      case 0:
        this.requestUsers();
        break;
      case 2:
        this.requestBizTypes();
        break;
      case 3:
        this.requestChannel();
        break;
      case 4:
        this.requestBizTypesClass();
        break;
    }
  }

  requestUsers() {
    this.http.post(URLS.blacklistAllUsersForList.url).subscribe(res => {
      if (res.data && res.data.length > 0) {
        this.userEnums = res.data.map(item => {
          return {
            // label: item.name,
            label: item.account,
            value: item.id,
          };
        });
        console.log(deepCopy(this.userEnums).length);
      }
    });
  }

  requestBizTypes() {
    this.http.post(URLS[`${this.cfgs.key}BlacklistAllBizType`].url).subscribe(res => {
      if (res.data && res.data.length > 0) {
        this.businessEnums = res.data.map(item => {
          return {
            label: item.name,
            value: item.id,
          };
        });
      }
    });
  }

  requestChannel() {
    this.http.post(URLS[`${this.cfgs.key}BlacklistChannel`].url + "/-1").subscribe(res => {
      if (res.data && res.data.length > 0) {
        this.channelEnums = res.data.map(item => {
          return {
            label: item.name,
            value: item.id,
          };
        });
      }
    });
  }

  requestBizTypesClass() {
    this.http.get(URLS[`${this.cfgs.key}BlacklistBizTypeClass`].url + "/" + this.cfgs.en_name + "/" + this.cfgs.type + "/" + STATE.ALL).subscribe(res => {
      if (res.data && res.data.length > 0) {
        this.bizTypeClassEnums = res.data.map(item => {
          return {
            label: item.bizCatName,
            value: item.id,
          };
        });
      }
    });
  }

  initSearchOptions() {
    this.searchOptions.strategyTypes.list = [
      { label: "全部", value: -1 },
      { label: "账号黑名单", value: 0 },
      { label: "全局黑名单", value: 1 },
      { label: "业务模板黑名单", value: 2 },
      { label: "业务分类黑名单", value: 4 },
    ];
    if (this.blacklistConf.list?.from) {
      this.searchOptions.handleFrom.list = [
        { label: "全部", value: -1 },
        { label: "自动加黑", value: 0 },
        { label: "手动加黑", value: 1 },
      ];
    }
    if (this.blacklistConf.list?.channel) {
      this.searchOptions.strategyTypes.list.push({
        label: "渠道黑名单",
        value: 3,
      });
    }
  }

  requestTreeNodes() {
    this.http.post(URLS[`${this.cfgs.key}BlacklistNodes`].url).subscribe(res => {
      if (res.status === 0 && res.data.length > 0) {
        this.nodes = res.data.map(item => ({
          key: item.id,
          title: this.cfgs.key === "workwx" ? item.channelNum : item.name,
          isLeaf: true,
        }));
        this.defaultSelectedKeys = [this.nodes[0].key]; // 默认选中根节点
        this.searchOptions.channelId = this.nodes[0].key;
        this.getTableList();
      }
    });
  }

  nzClick(event: NzFormatEmitEvent): void {
    const tmps: NzTreeNode[] = this.nzTreeComponent.getSelectedNodeList();
    let channelId = "";
    if (tmps && tmps[0]) {
      channelId = tmps[0].origin.key;
    }
    this.searchOptions.channelId = channelId;
    this.getTableList();
  }

  listenTreeHeight() {
    treeScrollcontrl("#tag-table-id", "#tag-table-wrapper-id", "#tree-outter-box-id");
  }

  onFilters(value, sourceList, target) {
    target.list = value ? sourceList.filter(e => e.label.indexOf(value) > -1) : sourceList;
  }

  getSearchParams() {
    let params: any = {
      terminalId: this.searchOptions.terminalId,
      strategyType: this.searchOptions.strategyTypes.select,
      msgType: this.cfgs.type,
      target:
        this.searchOptions.strategyTypes.select == 0
          ? this.searchOptions.user.select
          : this.searchOptions.strategyTypes.select == 2
          ? this.searchOptions.business.select
          : this.searchOptions.strategyTypes.select == 3
          ? this.searchOptions.channel.select
          : this.searchOptions.strategyTypes.select == 4
          ? this.searchOptions.bizTypeClass.select
          : -1,
      start: this.searchOptions.dateRange.length >= 1 ? format(new Date(this.searchOptions.dateRange[0]), "yyyy-MM-dd HH:mm:ss") : null,
      end: this.searchOptions.dateRange.length >= 2 ? format(new Date(this.searchOptions.dateRange[1]), "yyyy-MM-dd HH:mm:ss") : null,
    };
    if (this.blacklistConf.list?.from) {
      params.handleFrom = this.searchOptions.handleFrom.select;
    }
    if (this.searchOptions.channelId) {
      params.channelId = this.searchOptions.channelId;
    }
    return params;
  }

  getTableList() {
    this.st.reset({
      params: this.getSearchParams(),
    });
  }

  resetTableList() {
    this.searchOptions.strategyTypes.select = -1;
    this.searchOptions.user.select = -1;
    this.searchOptions.terminalId = "";
    this.searchOptions.dateRange = [];
    this.searchOptions.business.select = -1;
    this.searchOptions.channel.select = -1;
    this.searchOptions.bizTypeClass.select = -1;
    this.searchOptions.handleFrom.select = -1;
    // 重新加载table数据
    this.getTableList();
  }

  stChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox || [];
        break;
      case "pi":
        this.selectedRows = [];
        break;
    }
  }

  add() {
    if (this.blacklistConf.add.mode == 1 && this.searchOptions.channelId === "") {
      this.dialogService.notification.warning(`${this.cfgs.subject}黑名单`, `请先选中${this.cfgs.subject}分组!`);
      return;
    }
    let params: any = {};
    if (this.blacklistConf.add.mode == 1) {
      params = {
        record: {
          channelId: this.searchOptions.channelId,
          id: 0,
          columns: this.blacklistConf.add.column,
        },
        cfgs: this.cfgs,
      };
    } else {
      params = {
        record: {
          id: 0,
          channelId: this.searchOptions.channelId,
          terminalMaxLength: this.blacklistConf.add.terminalIdMaxLength,
        },
        cfgs: this.cfgs,
      };
    }

    let component = this.blacklistConf.add.mode == 1 ? BlackListEditComponent2 : BlackListEditComponent;
    this.modal
      .createStatic(component, params, {
        size: this.blacklistConf.add ? 1000 : 800,
      })
      .subscribe(() => this.st.reload());
  }

  importFile() {
    this.modal.createStatic(BlackListImportExportComponent, { cfgs: this.cfgs, channelId: this.searchOptions.channelId }, { size: 800 }).subscribe(() => {
      this.isOpenImport = true;
      this.cdr.detectChanges();
    });
  }
  goImport() {
    this.router.navigateByUrl("/system/import-export/import");
  }
  closeImport() {
    this.isOpenImport = false;
    this.st.reload();
  }

  exportFile() {
    // 判断前端表格是否有数据，如果没有，则直接返回“无数据可导出”
    if (!this.st._data || this.st._data.length === 0) {
      this.dialogService.notification.warning("导出", "无数据可导出");
      return;
    }
    this.http
      .post(URLS[`${this.cfgs.key}BlacklistExport`].url, {
        params: this.getSearchParams(),
      })
      .subscribe(res => {
        if (res.status === 0) {
          this.isOpenExport = true;
          this.cdr.detectChanges();
        } else {
          this.dialogService.notification.error("导出", res.errorMsg);
        }
      });
  }
  goExport() {
    this.router.navigateByUrl("/system/import-export/export");
  }

  batchDelete(): void {
    const items = this.selectedRows.filter(item => !item.default);
    if (!items.length) {
      this.dialogService.notification.error(`${this.cfgs.subject}黑名单`, `请选择需要删除的${this.cfgs.subject}黑名单`);
      return;
    }
    const options = {
      confirm: () => {
        this.delete(items.map(item => item.id));
      }, // 确定绑定方法
    };
    const messages = "是否确认删除所选记录？";
    this.dialogService.modal.confirm("请确认是否删除!", messages, options);
  }

  delete(ids: number[]) {
    if (ids.length === 0) {
      this.dialogService.notification.error(`${this.cfgs.subject}黑名单`, `请选择需要删除的${this.cfgs.subject}黑名单`);
    } else {
      this.http.post(URLS[`${this.cfgs.key}BlacklistDel`].url, ids).subscribe(res => {
        if (res.status === 0) {
          const pages = Math.ceil((this.total - ids.length) / this.ps);
          const pi = this.pi > pages && pages != 0 ? pages : this.pi;
          this.st.load(pi);
          // this.st.clearCheck();
          this.dialogService.notification.success(`${this.cfgs.subject}黑名单`, "删除成功");
        } else {
          this.dialogService.notification.error(`${this.cfgs.subject}黑名单`, res.errorMsg || "所选记录包含不可删除部分。");
        }
      });
    }
  }

  // 设置开始时间为00:00:00 结束时间为23:59:59
  onOkDate() {
    let start = this.searchOptions.dateRange[0] ? new Date(this.searchOptions.dateRange[0]).getTime() : 0;
    let end = this.searchOptions.dateRange[1] ? new Date(this.searchOptions.dateRange[1]).getTime() : 0;
    if (start > end) {
      this.searchOptions.dateRange[0] = end;
      this.searchOptions.dateRange[1] = start;
    }
    if (this.searchOptions.dateRange[0]) {
      // 设置开始时间为选择日期的 00:00:00
      this.searchOptions.dateRange[0] = new Date(new Date(new Date(this.searchOptions.dateRange[0]).toLocaleDateString()).getTime());
    }
    if (this.searchOptions.dateRange[1]) {
      // 设置开始时间为选择日期的 23:59:59
      this.searchOptions.dateRange[1] = new Date(new Date(new Date(this.searchOptions.dateRange[1]).toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
    }
  }
}
