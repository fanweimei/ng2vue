// import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from "@angular/core";
// import { _HttpClient, ModalHelper, ModalHelperOptions } from "@delon/theme";
// import { Router } from "@angular/router";
// import { ACLService } from "@delon/acl";
// import { STPage, STData, STComponent, STColumn, STReq, STRequestOptions, STRes, STChange } from "@delon/abc/st";
// import { SmsKeywordEditComponent } from "./edit/edit.component";
// import { SmsKeywordImportExportComponent } from "./import-export/import-export.component";
// import { MessageService } from "@icc/common-lib";
// import { DialogService } from "@icc/common-lib";
// import { URLS } from "../../shared/constant/interface";

// @Component({
//   selector: "app-sms-sendconstraint-keyword",
//   templateUrl: "./sms-sendconstraint-keyword.component.html",
//   styleUrls: ["./sms-sendconstraint-keyword.component.less"],
// })
// export class SmsConstraintKeywordComponent implements OnInit {
//   constructor(
//     private messageService: MessageService,
//     public http: _HttpClient,
//     private dialogService: DialogService,
//     private router: Router,
//     private modal: ModalHelper,
//     private cdr: ChangeDetectorRef,
//   ) {}

//   static NAME = "icc-msg-sendconstraint-keyword";

//   msgType = this.messageService.getMsgTypeByName("sms", true);
//   isOpenExport = false;
//   isOpenImport = false;

//   expandForm = false;
//   private timer; // 定时器
//   url = URLS.keywordList.url;
//   page: STPage = {};
//   // 确认框
//   isVisible = false;
//   isImporting = false;
//   id: any;
//   isBatch: any;
//   messages = "请确认是否要进行删除!!";
//   // 过期时间 10分钟
//   expiredTime = 10 * 60 * 60 * 1000;
//   downloadPath = URLS.attachment.url + "?module=6&attach=2&path=";
//   // 等待导出的文件路径列表
//   waitingExportFiles: any = [];
//   // 存放时间，用于过期
//   waitingExportFilesMap: { [key: string]: Date } = {};
//   // 选中的数据
//   selectedRows: STData[] = [];

//   userEnums: any = [{ label: "全部", value: -1 }];
//   bizEnums: any = [{ label: "全部", value: -1 }];
//   channelEnums: any = [{ label: "全部", value: -1 }];

//   // 删除最后一页内容
//   pi = 1;
//   ps = 10;
//   total = 0;

//   @ViewChild("st", { static: false }) st: STComponent;
//   columns: STColumn[] = [
//     {
//       title: "",
//       index: "id",
//       type: "checkbox",
//       fixed: "left",
//     },
//     {
//       title: "敏感字",
//       index: "keyword",
//       render: "templ-keyword",
//       width: 260,
//       className: "text-center",
//       fixed: "left",
//     },
//     {
//       title: "管控类型",
//       width: 150,
//       index: "controlType",
//       format: (item, _col) => {
//         if (item.controlType === 1) {
//           return "全局敏感字";
//         } else if (item.controlType === 2) {
//           return "账号敏感字";
//         } else if (item.controlType === 3) {
//           return "业务模板敏感字";
//         } else if (item.controlType === 4) {
//           return "渠道敏感字";
//         } else {
//           return "";
//         }
//       },
//       className: "text-center",
//     },
//     {
//       title: "关联账号",
//       width: 150,
//       index: "targetUserName",
//       render: "templ-account",
//       className: "text-center",
//     },
//     {
//       title: "关联业务模板",
//       width: 150,
//       index: "targetBizName",
//       render: "templ-targetBizName",
//       className: "text-center",
//     },
//     {
//       title: "关联渠道",
//       width: 150,
//       index: "targetChannelName",
//       render: "templ-targetChannelName",
//       className: "text-center",
//     },
//     {
//       title: "敏感字类型",
//       width: 110,
//       index: "keywordType",
//       format: (item, _col, index) => {
//         if (item.keywordType === 1) {
//           return "单一敏感字";
//         } else if (item.keywordType === 2) {
//           return "逻辑敏感字";
//         } else {
//           return "";
//         }
//       },
//       className: "text-center",
//     },
//     {
//       title: "管控策略",
//       width: 120,
//       index: "controlStrategy",
//       format: (item, _col, index) => {
//         if (item.controlStrategy === 1) {
//           return "自动拦截";
//         } else if (item.controlStrategy === 2) {
//           return "人工审核";
//         } else {
//           return "";
//         }
//       },
//       className: "text-center",
//     },
//     {
//       title: "更新人",
//       width: 150,
//       index: "updateUserName",
//       render: "templ-updateUserName",
//       className: "text-center",
//     },
//     {
//       title: "更新时间",
//       index: "updateTime",
//       width: 200,
//       className: "text-center",
//     },
//     {
//       title: "操作",
//       width: 150,
//       fixed: "right",
//       className: "text-center",
//       buttons: [
//         {
//           text: "编辑",
//           click: (item: any) => this.edit(item),
//           acl: { ability: ["sendconstraint.keyword.sms.edit"] },
//         },
//         {
//           text: "删除",
//           click: (item: any) => this.showModal(item.id, false),
//           acl: { ability: ["sendconstraint.keyword.sms.delete"] },
//         },
//       ],
//     },
//   ];
//   req: STReq = {
//     method: "POST",
//     allInBody: true,
//     body: {
//       params: {
//         // 短信类型
//         msgType: this.msgType,
//       },
//     },
//     process: (requestOptions: STRequestOptions) => {
//       this.pi = requestOptions.body.pi;
//       this.ps = requestOptions.body.ps;
//       return requestOptions;
//     },
//   };
//   controlTypeSearchEnums: any = [
//     { label: "全部", value: -1 },
//     { label: "全局敏感字", value: 1 },
//     { label: "账号敏感字", value: 2 },
//     { label: "业务模板敏感字", value: 3 },
//     { label: "渠道敏感字", value: 4 },
//   ];
//   keywordTypeSearchEnums: any = [
//     { label: "全部", value: -1 },
//     { label: "单一敏感字", value: 1 },
//     { label: "逻辑敏感字", value: 2 },
//   ];
//   controlStrategySearchEnums: any = [
//     { label: "全部", value: -1 },
//     { label: "自动拦截", value: 1 },
//     { label: "人工审核", value: 2 },
//   ];
//   res: STRes = {
//     process: (data, rawData) => {
//       this.total = rawData.total;
//       return data;
//     },
//   };
//   /*searchOptions*/
//   searchOptions: any = {
//     user: {
//       select: -1,
//       list: this.userEnums,
//     },
//     biz: {
//       select: -1,
//       list: this.bizEnums,
//     },
//     channel: {
//       select: -1,
//       list: this.channelEnums,
//     },
//     controlTypes: {
//       select: -1,
//       list: this.controlTypeSearchEnums,
//     },
//     keywordTypes: {
//       select: -1,
//       list: this.keywordTypeSearchEnums,
//     },
//     controlStrategys: {
//       select: -1,
//       list: this.controlStrategySearchEnums,
//     },
//     keyword: "",
//   };
//   options: ModalHelperOptions = {
//     /** 大小；例如：lg、600，默认：`lg` */
//     size: 800,
//   };
//   subject = "敏感字";
//   add() {
//     this.modal.createStatic(SmsKeywordEditComponent, { record: { id: 0 }, role: {} }, this.options).subscribe(() => this.st.reset());
//   }

//   edit(keyword) {
//     this.modal.createStatic(SmsKeywordEditComponent, { record: keyword }, this.options).subscribe(() => this.st.reset());
//   }

//   resetTableList() {
//     // 重置搜索条件
//     this.searchOptions.user.select = -1;
//     this.searchOptions.channel.select = -1;
//     this.searchOptions.biz.select = -1;
//     this.searchOptions.controlTypes.select = -1;
//     this.searchOptions.keywordTypes.select = -1;
//     this.searchOptions.controlStrategys.select = -1;
//     this.searchOptions.keyword = "";
//     // 重新加载table数据
//     this.getTableList();
//   }
//   stChange(e: STChange) {
//     switch (e.type) {
//       case "checkbox":
//         this.selectedRows = e.checkbox!;
//         break;
//       case "pi":
//         this.selectedRows = [];
//         break;
//       case "filter":
//         this.resetTableList();
//         break;
//     }
//   }

//   import() {
//     this.modal.createStatic(SmsKeywordImportExportComponent, this.options).subscribe(() => {
//       this.isOpenImport = true;
//       this.cdr.detectChanges();
//     });
//   }

//   export() {
//     // 判断前端表格是否有数据，如果没有，则直接返回“无数据可导出”
//     if (!this.st._data || this.st._data.length === 0) {
//       this.dialogService.notification.warning("导出", "无数据可导出");
//       return;
//     }
//     let targetId;
//     if (this.searchOptions.controlTypes.select == 2) {
//       targetId = this.searchOptions.user.select;
//     } else if (this.searchOptions.controlTypes.select == 3) {
//       targetId = this.searchOptions.biz.select;
//     } else if (this.searchOptions.controlTypes.select == 4) {
//       targetId = this.searchOptions.channel.select;
//     } else {
//       targetId = -1;
//     }
//     this.http
//       .post(URLS.keywordExport.url, {
//         params: {
//           // 短信类型
//           msgType: this.msgType,
//           // key: value  =》 接口参数名: 对应值
//           targetId: targetId,
//           controlType: this.searchOptions.controlTypes.select,
//           keywordType: this.searchOptions.keywordTypes.select,
//           controlStrategy: this.searchOptions.controlStrategys.select,
//           keyword: this.searchOptions.keyword,
//         },
//       })
//       .subscribe(res => {
//         if (res.status === 0) {
//           this.isOpenExport = true;
//           this.cdr.detectChanges();
//         } else {
//           this.dialogService.notification.error("导出", res.errorMsg);
//         }
//       });
//   }

//   getTableList() {
//     let targetId;
//     if (this.searchOptions.controlTypes.select == 2) {
//       targetId = this.searchOptions.user.select;
//     } else if (this.searchOptions.controlTypes.select == 3) {
//       targetId = this.searchOptions.biz.select;
//     } else if (this.searchOptions.controlTypes.select == 4) {
//       targetId = this.searchOptions.channel.select;
//     } else {
//       targetId = -1;
//     }
//     this.st.reset({
//       params: {
//         // 短信类型
//         msgType: this.msgType,
//         // key: value  =》 接口参数名: 对应值
//         targetId: targetId,
//         controlType: this.searchOptions.controlTypes.select,
//         keywordType: this.searchOptions.keywordTypes.select,
//         controlStrategy: this.searchOptions.controlStrategys.select,
//         keyword: this.searchOptions.keyword,
//       },
//     });
//   }

//   handleReload() {
//     this.st.reload();
//     this.isImporting = false;
//   }
//   showModal(id, isBatch): void {
//     this.id = id;
//     this.isBatch = isBatch;
//     if (id === "") {
//       this.validate(this.selectedRows.map(i => i.id).join(","));
//     } else {
//       // this.isVisible = true;
//       const options = {
//         confirm: () => {
//           this.handleOk();
//         }, // 确定绑定方法
//         cancel: this.handleCancel, // 取消绑定方法
//       };
//       const messages = "是否确认删除所选记录？";
//       this.dialogService.modal.confirm("请确认是否删除!", messages, options);
//     }
//   }
//   validate(ids: any) {
//     if (ids === "") {
//       this.dialogService.notification.error(this.subject, "请选择需要删除的敏感字!");
//       return false;
//     } else {
//       // this.isVisible = true;
//       const options = {
//         confirm: () => {
//           this.handleOk();
//         }, // 确定绑定方法
//         cancel: this.handleCancel, // 取消绑定方法
//       };
//       const messages = "是否确认删除所选记录？";
//       this.dialogService.modal.confirm("请确认是否删除!", messages, options);
//     }
//   }

//   handleCancel(): void {
//     this.isVisible = false;
//   }
//   handleOk() {
//     if (this.isBatch) {
//       this.delete();
//     } else {
//       this.deleteOne(this.id);
//     }
//     this.isVisible = false;
//   }
//   deleteOne(keywordId) {
//     const keywordIds = [keywordId];
//     this.http.post(URLS.keywordDel.url, { ids: keywordIds, msgType: this.msgType }).subscribe(res => {
//       if (res.status === 0) {
//         const pages = Math.ceil((this.total - 1) / this.ps);
//         const pi = (this.pi > pages && pages != 0) ? pages : this.pi;
//         this.st.load(pi);
//         this.dialogService.notification.success(this.subject, "删除成功");
//       } else {
//         this.dialogService.notification.error(this.subject, res.errorMsg);
//       }
//     });
//   }
//   delete() {
//     const items = this.selectedRows.filter(item => !item.default);
//     if (items.length === 0) {
//       this.dialogService.notification.error(this.subject, "请选择需要删除的敏感字");
//     } else {
//       const ids = items.map((keyword, index: number, array) => keyword.id);
//       this.http.post(URLS.keywordDel.url, { ids: ids, msgType: this.msgType }).subscribe(res => {
//         if (res.status === 0) {
//           const pages = Math.ceil((this.total - ids.length) / this.ps);
//           const pi = (this.pi > pages && pages != 0) ? pages : this.pi;
//           this.st.load(pi);
//           this.st.clearCheck();
//           this.dialogService.notification.success(this.subject, "删除成功");
//         } else {
//           this.dialogService.notification.error(this.subject, "所选记录包含不可删除部分。");
//         }
//       });
//     }
//   }
//   goImport() {
//     this.router.navigateByUrl("/system/import-export/import");
//   }

//   closeImport() {
//     this.isOpenImport = false;
//     this.getTableList();
//   }

//   goExport() {
//     this.router.navigateByUrl("/system/import-export/export");
//   }

//   closeExport() {
//     this.isOpenExport = false;
//   }

//   ngOnInit() {
//     this.http.post(URLS.keywordAllUsers.url + "/-1").subscribe(res => {
//       let userList = res.data;
//       if (userList.length > 0) {
//         userList.forEach((user, index: number, array) => {
//           this.userEnums.push({ label: user.account, value: user.id });
//         });
//       }
//     });
//     this.http.post(URLS.keywordAllBizs.url + this.msgType + "/-1").subscribe(res => {
//       let bizList = res.data;
//       if (bizList.length > 0) {
//         bizList.forEach((biz, index: number, array) => {
//           this.bizEnums.push({ label: biz.name, value: biz.id });
//         });
//       }
//     });
//     this.http.post(URLS.keywordAllChannels.url + this.msgType + "/-1").subscribe(res => {
//       let channelList = res.data;
//       if (channelList.length > 0) {
//         channelList.forEach((channel, index: number, array) => {
//           this.channelEnums.push({ label: channel.name, value: channel.id });
//         });
//       }
//     });
//   }

//   search(value) {
//     if (value) {
//       let userEnumsTemp: any[] = [];
//       this.userEnums.forEach(element => {
//         if (element.label.indexOf(value) > -1) {
//           userEnumsTemp.push(element);
//         }
//       });
//       this.searchOptions.user.list = userEnumsTemp;
//     } else {
//       this.searchOptions.user.list = this.userEnums;
//     }
//   }
//   searchChannel(value) {
//     if (value) {
//       let channelEnumsTemp: any[] = [];
//       this.channelEnums.forEach(element => {
//         if (element.label.indexOf(value) > -1) {
//           channelEnumsTemp.push(element);
//         }
//       });
//       this.searchOptions.channel.list = channelEnumsTemp;
//     } else {
//       this.searchOptions.channel.list = this.channelEnums;
//     }
//   }
//   searchBiz(value) {
//     if (value) {
//       let bizsEnumsTemp: any[] = [];
//       this.bizEnums.forEach(element => {
//         if (element.label.indexOf(value) > -1) {
//           bizsEnumsTemp.push(element);
//         }
//       });
//       this.searchOptions.biz.list = bizsEnumsTemp;
//     } else {
//       this.searchOptions.biz.list = this.bizEnums;
//     }
//   }
// }
