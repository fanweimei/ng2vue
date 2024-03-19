import { AfterViewChecked, AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { _HttpClient, ModalHelper, ModalHelperOptions } from "@delon/theme";
import { NzMessageService } from "ng-zorro-antd/message";
import { ActivatedRoute, Router } from "@angular/router";
import { STChange, STColumn, STComponent, STData, STPage, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { format } from "date-fns";
import { DialogService, getEndDate, getStartDate, isJsonString } from "@icc/common-lib";
import { MessageService } from "@icc/common-lib";
import { URLS } from "../../shared/constant/interface";
import { Subject } from "rxjs";
import { switchMap } from "rxjs/operators";

@Component({
  selector: "app-sms",
  templateUrl: "./sms.component.html",
  styleUrls: ["./sms.component.less"],
})
export class CommentSmsComponent implements OnInit, AfterViewInit, AfterViewChecked {
  isOpenReplyDialog; // 回复窗口
  selectTab = 0;
  currentUpstream;
  upContent;
  replyContent;
  postTime;
  msgId;
  tabList: Array<any> = [{ title: "文字", content: "" }];

  // 客户通讯录或员工通讯录
  contactType: number = 0;

  // 回复消息请求提
  replyMsg = {
    id: "",
    content: "",
  };
  customerCode;

  /* 回复内容最大字符数982 */
  maxlength: number = 982;

  constructor(
    private messageService: MessageService,
    private http: _HttpClient,
    private modal: ModalHelper,
    private msgSrv: NzMessageService,
    private router: Router,
    private dialogService: DialogService,
  ) {}

  // 自定义组件名
  static NAME = "icc-msg-comment";

  url = URLS.smsMoRecord.url;
  listCountUrl = URLS.smsMoRecordListCount.url;
  stTotal: number = 0;
  listCountLoading = false;
  listCount$ = new Subject<any>();
  @ViewChild("totalTemplate") totalTemp: TemplateRef<any>;

  expandForm = false;
  isOpenExport = false;
  isOpenContentDetail = false;
  isOpenReplyDetail = false;

  detailItem = {
    isMo: true,
    msgType: 0,
    content: "",
    type: "",
  };

  // 确定 loading
  loading: boolean = false;

  options: ModalHelperOptions = {
    /** 大小；例如：lg、600，默认：`lg` */
    size: "lg",
  };
  @ViewChild("st", { static: false }) st: STComponent;
  columns: STColumn[] = [
    {
      title: "接收渠道号",
      render: "tpl-channelNum",
      width: 232,
      className: "text-center",
    },
    {
      title: "上行号码",
      index: "terminalId",
      width: 150,
      className: "text-center",
    },
    {
      title: "接收账号",
      index: "receiveUser",
      width: 150,
      className: "text-center",
    },
    {
      title: "上行内容",
      render: "tpl-content",
      width: 300,
      className: "text-center",
      type: "link",
    },
    {
      title: "上行时间",
      index: "postTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      width: 200,
      className: "text-center",
    },
    {
      title: "回复状态",
      index: "replyState",
      type: "tag",
      width: 100,
      className: "text-center",
      tag: {
        0: { text: "未回复", color: "orange" },
        1: { text: "已回复", color: "green" },
        2: { text: "回复失败", color: "red" },
      },
    },
    {
      title: "回复内容",
      default: "",
      type: "link",
      width: 150,
      className: "text-center",
      render: "tpl-reply",
    },
    {
      title: "最近一次回复时间",
      index: "lastReplyTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      default: "",
      width: 200,
      className: "text-center",
    },
    {
      title: "操作",
      fixed: "right",
      width: 80,
      className: "text-center",
      buttons: [
        {
          text: "回复",
          click: (item: any) => {
            this.currentUpstream = item;
            this.upContent = isJsonString(item.content) ? JSON.parse(item.content).content : item.content;
            this.postTime = item.postTime;
            this.contactType = item.contactType || 0;
            this.msgId = item.ticketId;
            this.customerCode = item.customerCode;
            this.openReplyDialog();
          },
          acl: { ability: ["msgRecord.moRecord.sms.manuallyCallBack"] },
        },
      ],
    },
  ];
  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {
      params: {
        start: format(getStartDate(new Date(), 6), "yyyy-MM-dd HH:mm:ss"),
        end: format(getEndDate(new Date(), 0), "yyyy-MM-dd HH:mm:ss"),
      },
    },
    process: (requestOptions: STRequestOptions) => {
      return requestOptions;
    },
  };

  page: STPage = {
    total: false,
  };
  res: STRes = {};
  // 选中的数据
  selectedRows: STData[] = [];

  /*searchOptions*/
  searchOptions: any = {
    terminalId: "",
    channelNum: "",
    dateRange: [getStartDate(new Date(), 6), getEndDate(new Date(), 0)],
    statusList: {
      status: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "未回复", value: 0 },
        { label: "已回复", value: 1 },
        { label: "回复失败", value: 2 },
      ],
    },
  };

  // 等待导出的文件路径列表
  waitingExportFiles: any = [];
  // 存放时间，用于过期
  waitingExportFilesMap: { [key: string]: Date } = {};
  downloadPath = URLS.attachment.url + "?module=14&attach=2&path=";
  // 过期时间 10分钟
  expiredTime = 10 * 60 * 60 * 1000;

  stChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        break;
      case "pi":
        this.selectedRows = [];
        break;
      case "filter":
        this.st.reload();
        break;
    }
  }

  openReplyModal(item) {
    if (item.replyContent) {
      this.detailItem.type = "text";
      this.detailItem.content = item.replyContent;
      this.isOpenReplyDetail = true;
    }
  }

  ngOnInit() {
    this.detailItem = {
      isMo: true,
      msgType: this.messageService.getMsgTypeByName("sms", true),
      content: "",
      type: "",
    };
    this.listCount$
      .pipe(
        switchMap(params => {
          this.listCountLoading = true;
          return this.http.post(this.listCountUrl, {
            params: params || {
              terminalId: this.searchOptions.terminalId,
              channelNum: this.searchOptions.channelNum,
              replyState: this.searchOptions.statusList.status,
              start: this.searchOptions.dateRange.length >= 1 ? format(this.searchOptions.dateRange[0], "yyyy-MM-dd HH:mm:ss") : null,
              end: this.searchOptions.dateRange.length >= 2 ? format(this.searchOptions.dateRange[1], "yyyy-MM-dd HH:mm:ss") : null,
            },
            pi: 1,
            ps: 10,
          });
        }),
      )
      .subscribe(res => {
        this.stTotal = res.total;
        this.listCountLoading = false;
        const pages = Math.ceil(this.stTotal / this.st.ps) || 1;
        if (pages < this.st.pi) {
          this.st.pi = pages;
          this.st.reload();
        }
      });
    this.requestStTotal();
  }

  requestStTotal(params = null) {
    this.listCount$.next(params);
  }

  ngAfterViewInit(): void {
    this.st.orgTable.nzShowTotal = this.totalTemp;
  }

  ngAfterViewChecked(): void {
    this.st.orgTable.nzShowTotal = this.totalTemp;
  }

  getTableList() {
    this.st.reset({
      params: {
        terminalId: this.searchOptions.terminalId,
        channelNum: this.searchOptions.channelNum,
        replyState: this.searchOptions.statusList.status,
        start: this.searchOptions.dateRange.length >= 1 ? format(this.searchOptions.dateRange[0], "yyyy-MM-dd HH:mm:ss") : null,
        end: this.searchOptions.dateRange.length >= 2 ? format(this.searchOptions.dateRange[1], "yyyy-MM-dd HH:mm:ss") : null,
      },
    });
    this.requestStTotal();
  }

  resetTableList() {
    // 重置搜索条件
    this.searchOptions.terminalId = "";
    this.searchOptions.channelNum = "";
    this.searchOptions.dateRange = [getStartDate(new Date(), 6), getEndDate(new Date(), 0)];
    this.searchOptions.statusList.status = -1;
    // 重新加载table数据
    this.getTableList();
  }

  goExport() {
    this.router.navigateByUrl("/system/import-export/export");
  }

  _handleClose() {
    this.detailItem.content = "";
    this.isOpenContentDetail = false;
    this.isOpenReplyDetail = false;
  }

  closeExport() {
    this.isOpenExport = false;
  }
  export() {
    // 判断前端表格是否有数据，如果没有，则直接返回“无数据可导出”
    if (!this.st._data || this.st._data.length === 0) {
      this.dialogService.notification.warning("导出", "无数据可导出");
      return;
    }
    this.http
      .post(URLS.smsMoRecordExport.url, {
        params: {
          terminalId: this.searchOptions.terminalId,
          channelNum: this.searchOptions.channelNum,
          replyState: this.searchOptions.statusList.status,
          start: this.searchOptions.dateRange.length >= 1 ? format(this.searchOptions.dateRange[0], "yyyy-MM-dd HH:mm:ss") : null,
          end: this.searchOptions.dateRange.length >= 2 ? format(this.searchOptions.dateRange[1], "yyyy-MM-dd HH:mm:ss") : null,
        },
      })
      .subscribe(res => {
        if (res.status === 0) {
          this.isOpenExport = true;
          this.waitingExportFiles.push(res.data);
          this.waitingExportFilesMap[res.data] = new Date();
        } else {
          this.dialogService.notification.error("导出", res.errorMsg);
        }
      });
  }

  // 回复弹窗
  openReplyDialog() {
    this.replyContent = "";
    this.isOpenReplyDialog = true;
  }
  closeReplyDialog() {
    this.isOpenReplyDialog = false;
  }

  /**
   * 回复弹窗 - 确认
   */
  ensureReplyDialog(): void {
    if (!this.replyContent || this.replyContent.trim() === "") {
      this.msgSrv.error("请输入回复内容", {
        nzDuration: 3000,
      });
      return;
    }
    this.replyMsg.id = this.msgId;
    this.replyMsg.content = this.replyContent;

    // 提交到后台
    this.loading = true;
    this.http.post(URLS.smsMoRecordManuallyCallBack.url, this.replyMsg).subscribe(res => {
      if (res.status === 0) {
        this.msgSrv.success("回复成功");
        this.loading = false;
        // 关闭弹窗。
        this.closeReplyDialog();
        this.msgId = "";
        this.replyContent = "";
        // 重新加载table数据
        this.getTableList();
      } else {
        if (res.status == -99 && res.data && res.data.data.length) {
          res.errorMsg = `回复内容包含敏感字！包含敏感字${(res.data.data[0].contents.length > 20
            ? res.data.data[0].contents.slice(0, 20) + "..."
            : res.data.data[0].contents
          )
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")}，请修改！`;
        }
        this.msgSrv.error("回复失败，" + res.errorMsg);
        this.loading = false;
      }
    });
  }
  // 回复弹窗 - 取消
  cancelReplyDialog(): void {
    console.log("取消");
    this.closeReplyDialog();
  }

  gotoTimeLine(): void {
    if (!this.customerCode) {
      this.msgSrv.error("当前用户非通讯录中用户，暂不可查询");
      return;
    }
    this.router.navigateByUrl("/icc-standard/msgRecord/timeRecord?customerCode=" + this.customerCode + "&selectedValue=" + this.contactType);
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

  // 点击上行内容
  clickContent(item) {
    console.log(`item`, item);
    const SmsModalDetailComponent = this.messageService.getModalDetailComponent(this.messageService.getMsgTypeByName("sms", true));
    if (SmsModalDetailComponent) {
      this.modal
        .createStatic(
          SmsModalDetailComponent,
          {
            moContent: isJsonString(item.content) ? JSON.parse(item.content).content : item.content,
            isMo: true,
          },
          this.options,
        )
        .subscribe(() => {});
    }
  }
}
