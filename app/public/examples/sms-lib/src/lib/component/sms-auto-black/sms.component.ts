// import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
// import { _HttpClient, ModalHelper } from "@delon/theme";
// import { STComponent, STColumn, STReq, STRequestOptions, STRes, STPage, STData, STChange } from "@delon/abc/st";
// import {  NzTreeComponent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
// import { FormBuilder, FormGroup, Validators } from "@angular/forms";
// import { AutoBlackListEditComponent } from "./edit/edit.component";
// import { format } from "date-fns";
// import { MessageService } from "@icc/common-lib";
// import { DialogService } from "@icc/common-lib";
// import { URLS } from "../../shared/constant/interface";
// import { NzMessageService } from "ng-zorro-antd/message";
// import { NzTreeBase } from "ng-zorro-antd/core/tree";

// @Component({
//   selector: "app-auto-black-list-sms",
//   templateUrl: "./sms.component.html",
//   styleUrls: ["./sms.component.less"],
// })
// export class AutoBlackListSMSComponent implements OnInit, AfterViewInit {
//   static NAME = "icc-msg-auto-black";

//   constructor(
//     private messageService: MessageService,
//     private http: _HttpClient,
//     private dialogService: DialogService,
//     private modal: ModalHelper,
//     private fb: FormBuilder,
//     private msgSrv: NzMessageService,
//   ) {
//     this.validateForm = this.fb.group({
//       keyword: ["", [Validators.required]],
//       userId: [""],
//       content: ["", [Validators.required]],
//       blackListType: [""],
//     });
//   }

//   // 回复内容对话框
//   isContentDialogVisible = false;
//   replyContent;

//   url = URLS.smsAutoBlackList.url;
//   subject = "自动加黑";
//   // 页面类型 1： 回复， 2：加黑， 3：上报
//   type = "2";

//   account: any = "-1";
//   channel: any = "-1";
//   bizType: any = "-1";
//   msgType = this.messageService.getMsgTypeByName("sms", true);

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
//       width: 50,
//       fixed: "left",
//     },
//     {
//       title: "黑名单类型",
//       index: "userId",
//       className: "text-center",
//       width: 132,
//       format: row => {
//         if (!row.autoRespConfigs) {
//           return "-";
//         }
//         for (let item of row.autoRespConfigs) {
//           if (item.respType == 2) {
//             switch (item.targetType) {
//               case 0:
//                 return "账号黑名单";
//               case 1:
//                 return "全局黑名单";
//               case 2:
//                 return "业务模板黑名单";
//               case 3:
//                 return "渠道黑名单";
//             }
//           }
//         }
//         return "-";
//       },
//     },
//     {
//       title: "关键字",
//       render: "keywordTpl",
//       className: "text-center",
//       width: 152,
//     },
//     {
//       title: "回复内容",
//       width: 232,
//       render: "contentTpl",
//       className: "text-center",
//     },
//     {
//       title: "关联账号",
//       default: "-",
//       index: "userAccount",
//       className: "text-center",
//       render: "templ-account",
//       width: 132,
//     },
//     {
//       title: "关联渠道",
//       default: "-",
//       className: "text-center",
//       index: "channelName",
//       render: "templ-channelName",
//       width: 152,
//     },
//     {
//       title: "响应业务模板",
//       default: "-",
//       className: "text-center",
//       index: "businessName",
//       render: "templ-businessName",
//       width: 152,
//     },
//     {
//       title: "更新人",
//       index: "updateUserName",
//       className: "text-center",
//       width: 132,
//     },
//     {
//       title: "更新时间",
//       width: 200,
//       index: "updateTime",
//       type: "date",
//       dateFormat: "yyyy-MM-dd HH:mm:ss",
//       className: "text-center",
//     },
//     {
//       title: "状态",
//       type: "tag",
//       index: "state",
//       width: 100,
//       className: "text-center",
//       tag: {
//         1: { text: "已启用", color: "green" },

//         0: { text: "已停用", color: "red" },
//       },
//     },
//     {
//       title: "操作",
//       className: "text-center",
//       width: 200,
//       fixed: "right",
//       buttons: [
//         {
//           text: smsAutoReply => {
//             if (smsAutoReply.state === 0) return "启用";
//             else {
//               return "停用";
//             }
//           },
//           click: (item: any) => this.comfrim(item),
//           acl: { ability: ["autoBlacklist.sms.active"] },
//         },
//         {
//           text: "编辑",
//           click: (item: any) => this.edit(item),
//           acl: { ability: ["autoBlacklist.sms.edit"] },
//         },
//         {
//           text: "删除",
//           click: (item: any) => this.showModal(item, false),
//           acl: { ability: ["autoBlacklist.sms.delete"] },
//         },
//       ],
//     },
//   ];

//   isVisible = false;
//   validateForm: FormGroup;

//   // 黑名单类型
//   blackListType: number;
//   // 账号树状结构
//   userNodes: [];
//   container = null;

//   req: STReq = {
//     method: "POST",
//     allInBody: true,
//     body: {},
//     process: (requestOptions: STRequestOptions) => {

//       this.pi = requestOptions.body.pi;
//       this.ps = requestOptions.body.ps;

//       if (!requestOptions.body.params.keywordType === undefined) {
//         requestOptions.body.params.keywordType = -1;
//       }
//       if (requestOptions.body.params.accounts === undefined) {
//         requestOptions.body.params.accounts = [];
//       }
//       if (requestOptions.body.params.channels === undefined) {
//         requestOptions.body.params.channels = [];
//       }
//       if (requestOptions.body.params.bizTypes === undefined) {
//         requestOptions.body.params.bizTypes = [];
//       }
//       if (!requestOptions.body.params.keyword === undefined) {
//         requestOptions.body.params.keyword = "";
//       }
//       if (requestOptions.body.params.startDate === undefined) {
//         requestOptions.body.params.startDate = "";
//       }
//       if (requestOptions.body.params.endDate === undefined) {
//         requestOptions.body.params.endDate = "";
//       }
//       requestOptions.body.params.msgTypes = [this.msgType];
//       requestOptions.body.params.type = this.type;
//       return requestOptions;
//     },
//   };
//   res: STRes = {
//     process: (data, rawData) => {
//       this.total = rawData.total;
//       return data;
//     },
//   };
//   setScrollToptoZero = false;
//   page: STPage = {
//     toTop: false,
//   };

//   selectedRows: STData[] = [];
//   id: any;
//   isBatch: any;
//   messages: any;
//   linkedAccounts: any[] = [];
//   allLinkedAccounts = [];
//   linkedBizTypes: any[] = [];
//   allLinkedBizTypes: any[] = [];
//   linkedChannels: any[] = [];
//   allLinkedChannels = [];

//   searchAccount;
//   searchChannel;
//   searchBizType;

//   userEnums: any = [{ label: "全部", value: -1 }];
//   businessEnums: any = [{ label: "全部", value: -1 }];
//   channelEnums: any = [{ label: "全部", value: -1 }];
//   msgTypeEnums: any = [];

//   /*searchOptions*/
//   searchOptions: any = {
//     keyword: "",
//     keywordTypes: {
//       select: "-1",
//       list: [
//         { label: "全部", value: "-1" },
//         { label: "账号黑名单", value: "0" },
//         { label: "全局黑名单", value: "1" },
//         { label: "业务模板黑名单", value: "2" },
//         { label: "渠道黑名单", value: "3" },
//       ],
//     },
//     targetId: -1,
//     accounts: {
//       select: -1,
//       list: this.userEnums,
//     },
//     channels: {
//       select: -1,
//       list: this.channelEnums,
//     },
//     bizTypes: {
//       select: -1,
//       list: this.businessEnums,
//     },
//     startDate: "",
//     endDate: "",
//   };

//   expandForm = false;

//   @ViewChild("nzTreeComponent", { static: false })
//   nzTreeComponent: NzTreeComponent;
//   nodes: NzTreeNodeOptions[] = [];
//   defaultExpandedKeys = []; // 默认展开根节点

//   ngOnInit() {
//     setTimeout(() => {
//       this.resetTableList();
//     }, 200);
//     this.getUsers();
//     this.getChannel();
//     this.getBizType();
//   }

//   ngAfterViewInit() {}

//   getUsers() {
//     const urlSel = URLS.smsAutoBlackListGetAccounts.url + "/-1" + "/" + this.account + "/0";
//     this.http.get(urlSel).subscribe(res => {
//       if (res.status === 0 && res.data && res.data.length > 0) {
//         this.linkedAccounts = res.data;
//         this.allLinkedAccounts = res.data;
//       }
//     });
//   }

//   getChannel() {
//     const urlSel = URLS.smsAutoBlackListGetChannels.url + "/" + this.msgType + "/" + this.channel + "/-1";
//     this.http.get(urlSel).subscribe(res => {
//       if (res.status === 0 && res.data && res.data.length > 0) {
//         this.linkedChannels = res.data;
//         this.allLinkedChannels = res.data;
//       }
//     });
//   }

//   getBizType() {
//     const urlSel = URLS.smsAutoBlackListGetBizTypes.url + "/" + this.msgType + "/-1";
//     this.http.get(urlSel).subscribe(res => {
//       if (res.status === 0 && res.data && res.data.length > 0) {
//         this.linkedBizTypes = res.data;
//         this.allLinkedBizTypes = res.data;
//       }
//     });
//   }

//   recursionExpand(selectKey, expandedKeys: any[], treeComponent: NzTreeBase) {
//     expandedKeys.push(selectKey);
//     const tmpNode = treeComponent.getTreeNodeByKey(selectKey);
//     if (tmpNode) {
//       if (tmpNode.parentNode) {
//         this.recursionExpand(tmpNode.parentNode.key, expandedKeys, treeComponent);
//       }
//     }
//   }

//   getTableList() {
//     this.searchOptions.accounts = [];
//     if (this.searchAccount) {
//       this.searchOptions.accounts.push(this.searchAccount);
//     }
//     this.searchOptions.channels = [];
//     if (this.searchChannel) {
//       this.searchOptions.channels.push(this.searchChannel);
//     }
//     this.searchOptions.bizTypes = [];
//     if (this.searchBizType) {
//       this.searchOptions.keywordTypes.select = "2";
//       this.searchOptions.targetId = this.searchBizType;
//       this.searchOptions.bizTypes.push(this.searchBizType);
//     }
//     // 格式化日期
//     this.searchOptions.startDate = this.searchOptions.startDate ? format(new Date(this.searchOptions.startDate), "yyyy-MM-dd HH:mm:ss") : "";
//     this.searchOptions.endDate = this.searchOptions.endDate ? format(new Date(this.searchOptions.endDate), "yyyy-MM-dd HH:mm:ss") : "";
//     this.st.reset({
//       params: {
//         // key: value  =》 接口参数名: 对应值
//         msgTypes: this.msgType,
//         keyword: this.searchOptions.keyword,
//         keywordType: this.searchOptions.keywordTypes.select,
//         matchUserIds: this.searchOptions.accounts,
//         targetIds: [],
//         channelIds: this.searchOptions.channels,
//         bizTypeIds: this.searchOptions.bizTypes,
//         startDate: this.searchOptions.startDate,
//         targetId: this.searchOptions.targetId,
//         endDate: this.searchOptions.endDate,
//       },
//     });
//     // console.log('this.searchOptions :>> ', this.searchOptions);
//   }

//   resetTableList() {
//     // 重置搜索条件
//     this.searchOptions.keywordTypes.select = "-1";
//     this.searchOptions.accounts = [];
//     this.searchOptions.channels = [];
//     this.searchOptions.bizTypes = [];
//     this.searchAccount = null;
//     this.searchChannel = null;
//     this.searchBizType = null;
//     this.searchOptions.keyword = "";
//     this.searchOptions.dateRange = [];
//     this.searchOptions.startDate = "";
//     this.searchOptions.endDate = "";
//     this.searchOptions.end = "";
//     this.searchOptions.targetId = -1;
//     // 重新加载table数据
//     this.getTableList();
//   }

//   showModal(item, isBatch): void {
//     if (this.selectedRows.length === 0 && isBatch) {
//       this.dialogService.notification.warning(this.subject, "请先选择自动加黑记录！");
//       return;
//     }
//     if (!isBatch) {
//       this.id = item.id;
//     }
//     this.isBatch = isBatch;
//     this.messages = "是否确认删除所选数据?";
//     const options = {
//       confirm: () => {
//         this.handleOk();
//       }, // 确定绑定方法
//       cancel: this.handleCancel, // 取消绑定方法
//     };
//     this.dialogService.modal.confirm("请确认是否删除!", this.messages, options);
//   }

//   handleOk(): void {
//     if (this.isBatch) {
//       this.delete();
//     } else {
//       this.deleteOne(this.id);
//     }
//   }

//   handleCancel(): void {}

//   // 增加黑名单
//   handleAddOk(): void {
//     this.isVisible = false;
//     let url = URLS.smsAutoBlackListAdd.url;
//     this.http.post(url, this.validateForm.value).subscribe(res => {
//       if (res.status === 0) {
//         this.getTableList();
//       }
//     });
//   }

//   handleAddCancel(): void {
//     this.isVisible = false;
//   }

//   // 展示回复内容框
//   showContentDialog(item: any) {
//     item.autoRespConfigs.forEach(autoRespConfig => {
//       if (autoRespConfig.respType === 1) {
//         this.replyContent = autoRespConfig.autoRespParams[0].content;
//       }
//     });
//     this.isContentDialogVisible = true;
//   }

//   // 关闭和确定回复内容框
//   handleContentDialogCancelAndOk(): void {
//     this.isContentDialogVisible = false;
//     this.replyContent = "";
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

//   /**
//    * 增加
//    */
//   add() {
//     this.modal
//       .createStatic(AutoBlackListEditComponent, { isRelevance: "c", record: { id: 0 }, role: {} }, { size: 750 })
//       .subscribe(() => this.resetTableList());
//   }

//   edit(autoBlackList) {
//     this.modal.createStatic(AutoBlackListEditComponent, { record: autoBlackList }, { size: 750 }).subscribe(() => this.resetTableList());
//   }

//   detail(item) {}

//   /**
//    * 删除单条
//    * @param id
//    */
//   deleteOne(id) {
//     this.http.post(URLS.smsAutoBlackListDelete.url, [id]).subscribe(res => {
//       if (res.status === 0) {
//         const pages = Math.ceil((this.total - 1) / this.ps);
//         const pi = (this.pi > pages && pages != 0) ? pages : this.pi;
//         this.st.load(pi);
//         this.dialogService.notification.success(this.subject, "删除成功");
//       } else {
//         this.dialogService.notification.error(this.subject, "删除失败");
//       }
//     });
//   }

//   /**
//    * 批量删除
//    */
//   delete() {
//     const ids = this.selectedRows.map(i => i.id)
//     this.http
//       .post(
//         URLS.smsAutoBlackListDelete.url,
//         ids,
//       )
//       .subscribe(res => {
//         if (res.status === 0) {
//           const pages = Math.ceil((this.total - ids.length) / this.ps);
//           const pi = (this.pi > pages && pages != 0) ? pages : this.pi;
//           this.st.load(pi);
//           this.st.clearCheck();
//           this.dialogService.notification.success(this.subject, "删除成功");
//         } else {
//           this.dialogService.notification.error(this.subject, "删除失败");
//         }
//       });
//   }

//   // 提交表单
//   submitForm(value: { blackListType: number; userId: number; keyword: string; content: string }): void {
//     // alert(1);
//     // let url = URLS.autoBlackListAdd.url;
//     // this.http.post(url, value).subscribe(res => {
//     //     this.handleAddOk();
//     // });
//   }

//   resetForm(e: MouseEvent): void {
//     e.preventDefault();
//     this.validateForm.reset();
//     for (const key in this.validateForm.controls) {
//       this.validateForm.controls[key].markAsPristine();
//       this.validateForm.controls[key].updateValueAndValidity();
//     }
//   }

//   // 用户选择下拉框改变事件
//   changeSelectUser(msgType: number, $event: string): void {
//     // console.log($event)
//     if ($event) {
//       if ($event.startsWith("dept")) {
//         this.msgSrv.error("当前选择的是分组名称，请正确选择账号。", {
//           nzDuration: 3000,
//         });
//         this.validateForm.get("userId")?.setValue("");
//       }
//       return;
//     }
//   }

//   /**
//    * 启用或停用
//    * @param smsAutoReply
//    */
//   comfrim(autoBlackList) {
//     // 当进行停用时，需中央弹窗提示【是否停用所选记录？】
//     if (autoBlackList.state === 1) {
//       // 是否停用所选记录？
//       let messages = "是否停用所选记录？";
//       const options = {
//         confirm: () => {
//           this.active(autoBlackList);
//         }, // 确定绑定方法
//         cancel: this.handleCancel, // 取消绑定方法
//       };
//       this.dialogService.modal.confirm("请确认是否停用!", messages, options);
//     } else {
//       this.active(autoBlackList);
//     }
//   }

//   active(autoBlackList) {
//     let operation;
//     // '0:停用，1:启用',
//     if (autoBlackList.state === 1) {
//       autoBlackList.state = 0;
//       operation = "停用";
//     } else {
//       autoBlackList.state = 1;
//       operation = "启用";
//     }
//     this.http.post(URLS.smsAutoBlackListActive.url, autoBlackList).subscribe(res => {
//       if (res.status === 0) {
//         this.getTableList();
//         this.dialogService.notification.success(this.subject, `${operation}成功`);
//       } else {
//         this.dialogService.notification.success(this.subject, `${res.errorMsg}`);
//       }
//     });
//   }

//   searchAccounts(event) {
//     !event || event.trim() === "" ? (this.account = "-1") : (this.account = event);
//     this.getUsers();
//   }

//   searchChannels(event) {
//     !event || event.trim() === "" ? (this.channel = "-1") : (this.channel = event);
//     this.getChannel();
//   }

//   searchBizTypes(event) {
//     let name = event ? event.trim() : "";
//     this.linkedBizTypes = name ? this.allLinkedBizTypes.filter(item => item.name.includes(name)) : this.allLinkedBizTypes.slice(0);
//   }

//   onOkDate() {
//     // 防止开始时间大于结束时间
//     let start = this.searchOptions.startDate ? this.searchOptions.startDate.getTime() : 0;
//     let end = this.searchOptions.endDate ? this.searchOptions.endDate.getTime() : 0;
//     if (start > end) {
//       this.searchOptions.startDate = end;
//       this.searchOptions.endDate = start;
//     }
//     if (this.searchOptions.startDate) {
//       // 设置开始时间为选择日期的 00:00:00
//       this.searchOptions.startDate = new Date(new Date(new Date(this.searchOptions.startDate).toLocaleDateString()).getTime());
//     }
//     if (this.searchOptions.endDate) {
//       // 设置开始时间为选择日期的 23:59:59
//       this.searchOptions.endDate = new Date(new Date(new Date(this.searchOptions.endDate).toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
//     }
//   }

//   // 解析回复内容
//   parseReplyContent(item) {
//     let content = "";
//     if (item.autoRespConfigs && item.autoRespConfigs.length > 0) {
//       item.autoRespConfigs.forEach(element => {
//         if (element.respType === 1 && element.autoRespParams) {
//           if (element.autoRespParams[0] && element.autoRespParams[0].content) {
//             content = element.autoRespParams[0].content;
//           }
//         }
//       });
//     }
//     return content || "-";
//   }

//   keywordTypeChange(event) {
//     if (event === 0) {
//       this.searchOptions.channels = [];
//       this.searchOptions.bizTypes = [];
//       this.searchChannel = null;
//       this.searchBizType = null;
//       this.searchOptions.targetId = -1;
//     } else if (event === 2) {
//       this.searchOptions.accounts = [];
//       this.searchOptions.channels = [];
//       this.searchAccount = null;
//       this.searchChannel = null;
//       this.searchOptions.targetId = -1;
//     } else if (event === 3) {
//       this.searchOptions.accounts = [];
//       this.searchOptions.bizTypes = [];
//       this.searchAccount = null;
//       this.searchBizType = null;
//       this.searchOptions.targetId = -1;
//     } else {
//       this.searchOptions.accounts = [];
//       this.searchOptions.channels = [];
//       this.searchOptions.bizTypes = [];
//       this.searchAccount = null;
//       this.searchChannel = null;
//       this.searchBizType = null;
//       this.searchOptions.targetId = -1;
//     }
//   }
// }
