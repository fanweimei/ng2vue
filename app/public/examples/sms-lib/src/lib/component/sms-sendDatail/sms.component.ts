import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { STChange, STColumn, STComponent, STData, STReq, STPage, STRes, STRequestOptions } from "@delon/abc/st";
import { _HttpClient, ModalHelperOptions, ModalHelper } from "@delon/theme";
import { differenceInCalendarDays, format } from "date-fns";
import { DialogService, getEndDate, getStartDate, isJsonString, MessageService, saferHTML } from "@icc/common-lib";
import { URLS } from "../../shared/constant/interface";
import { MSG_TYPE } from "../../shared/constant/msgType";

@Component({
  selector: "app-msgRecord-sendDetail-sms",
  templateUrl: "./sms.component.html",
  styleUrls: ["./sms.component.less"],
})
export class SendDetailSmsComponent implements OnInit, AfterViewInit {
  constructor(
    private http: _HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private modal: ModalHelper,
    private messageService: MessageService,
  ) {}

  @ViewChild("st", { static: false }) st: STComponent;

  // 自定义组件名
  static NAME = "icc-msg-sendDetail";

  // 初始化 sf data 数据，单向传递，sf 表单修改后不能回传数据，需要 sf.value
  hisSuffixOffset = "";
  q: any = {
    params: {
      aimTplId: "",
      aimTplName: "",
      sendResult: -1,
      packName: "",
      phone: "",
      moResult: -1,
      packId: "",
      shardTime: null,
      start: format(getStartDate(new Date(), 6), "yyyy-MM-dd HH:mm:ss"),
      end: format(getEndDate(new Date(), 0), "yyyy-MM-dd HH:mm:ss"),
      appTypeId: 1,
      signatureType: -2,
      signature: "",
    },
  };
  appTypeKey = "";

  // 批次名称
  batchName = "";

  msgName = "短信";

  tplId: string;
  isTemplateView: boolean = false;

  expandForm = false;
  queryParams: any = {
    id: "0",
    appTypeId: -1,
    isDetail: false,
    sentCount: 0,
    validTickets: 0,
    successCount: 0,
    failCount: 0,
    unknownCount: 0,
    moCount: 0,
    shardTime: null,
    invalidTickets: 0,
    validTicketsFail: 0,
  };

  url = URLS.smsSendDetail.url;

  options: ModalHelperOptions = {
    size: 800,
  };

  page: STPage = {
    zeroIndexed: true,
  };

  columns: STColumn[] = [
    {
      title: "编号",
      index: "id",
      fixed: "left",
      width: 50,
      type: "checkbox",
      iif: () => this.queryParams.isDetail,
    },
    {
      title: "批次名称",
      render: "tpl-batchName",
      fixed: "left",
      width: 250,
      className: "text-center",
      iif: () => {
        return !this.queryParams.isDetail;
      },
    },
    {
      title: "一级分类",
      render: "tpl-firstCategoryName",
      width: 100,
      className: "text-center",
    },
    {
      title: "二级分类",
      render: "tpl-secondCategoryName",
      width: 100,
      className: "text-center",
    },
    {
      title: "业务模板",
      render: "tpl-bizTypeName",
      width: 132,
      className: "text-center",
    },
    {
      title: "客户编码",
      render: "tpl-customerCode",
      width: 100,
      className: "text-center",
    },
    {
      title: "姓名",
      render: "tpl-userName",
      width: 112,
      className: "text-center",
    },
    {
      title: "所属分组",
      render: "tpl-userGroups",
      width: 132,
      className: "text-center",
    },
    {
      title: "手机号码",
      index: "terminalId",
      width: 140,
      className: "text-center",
    },
    {
      title: "模板ID",
      index: "aimTplId",
      width: 120,
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 4,
    },
    {
      title: "模板名称",
      render: "tpl-aimTplName",
      width: 232,
      className: "text-center",
      // format: item => {
      //   return saferHTML`${item.aimTplName}`;
      // },
      iif: () => this.searchOptions.appTypeId === 4,
    },
    {
      title: "链接任务名称",
      render: "tpl-aimJobName",
      width: 152,
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 4,
    },
    {
      title: "触发关键字",
      render: "tpl-matchKeyWord",
      width: 152,
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 2,
    },
    {
      title: "签名类型",
      index: "signatureTypeName",
      width: 140,
      className: "text-center",
    },
    {
      title: "签名内容",
      render: "tpl-signature",
      width: 152,
      className: "text-center",
    },
    // {
    //   title: "发送账号",
    //   render: "tpl-account",
    //   width: 152,
    //   className: "text-center",
    //   iif: () => this.searchOptions.appTypeId !== 4,
    // },
    {
      title: "发送内容",
      width: 232,
      type: "link",
      className: "text-center",
      render: "tpl-content",
    },
    {
      title: "是否自动撞库",
      width: 150,
      index: "aimNumberCheckStatus",
      type: "badge",
      badge: {
        0: { text: "否", color: "error" },
        1: { text: "是", color: "success" },
        2: { text: "失败", color: "error" },
      },
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 4,
    },
    {
      title: "发送策略",
      render: "tpl-strategy",
      width: 150,
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 1 || this.searchOptions.appTypeId === 4,
    },
    {
      title: "核验结果",
      index: "bizFormState",
      type: "badge",
      badge: {
        true: { text: "核验成功", color: "success" },
        false: { text: "核验失败", color: "error" },
      },
      width: 120,
      className: "text-center",
    },
    {
      title: "核验报告",
      render: "tpl-bizFormStr",
      width: 200,
      className: "text-center",
    },
    {
      title: "提交结果",
      index: "ticketState",
      type: "badge",
      badge: {
        1: { text: "等待提交", color: "processing" },
        2: { text: "提交成功", color: "success" },
        3: { text: "取消提交", color: "default" },
        4: { text: "提交失败", color: "error" },
      },
      width: 120,
      className: "text-center",
    },
    {
      title: "提交失败原因",
      render: "tpl-submitOriginResultStr",
      width: 130,
      className: "text-center",
    },
    {
      title: "发送结果",
      index: "result",
      type: "badge",
      badge: {
        1: { text: "成功", color: "success" },
        2: { text: "失败", color: "error" },
        3: { text: "未知", color: "default" },
      },
      width: 100,
      className: "text-center",
    },
    {
      title: "状态报告",
      index: "sendResult",
      width: 200,
      className: "text-center",
    },
    // **************** start  状态报告描述模块 **************************
    {
      title: "状态码描述",
      render: "tpl-stateReportDescription",
      width: 140,
      className: "text-center",
    },
    // **************** end  状态报告描述模块  **************************
    {
      title: "上行情况",
      index: "hasMo",
      type: "badge",
      badge: {
        true: { text: "已上行", color: "success" },
        false: { text: "未上行", color: "error" },
      },
      width: 100,
      className: "text-center",
    },
    {
      title: "上行内容",
      width: 150,
      className: "text-center",
      type: "link",
      click: item => {
        if (item.hasMo) {
          this.openMoContentModal(item.moContent);
        }
      },
      format: item => {
        let temp: string = isJsonString(item.moContent) ? JSON.parse(item.moContent).content : item.moContent;
        return item.hasMo ? (temp?.length < 10 ? temp?.substring(0, 10) : temp?.substring(0, 10) + "...") : "-";
      },
    },
    {
      title: "串行补发",
      index: "resend",
      type: "tag",
      tag: {
        false: { text: "否", color: "green" },
        true: { text: "是", color: "green" },
      },
      width: 100,
      className: "text-center",
      iif: () => this.searchOptions.appTypeId === 1 || this.searchOptions.appTypeId === 4,
    },
    {
      title: "运营商",
      index: "carrier",
      width: 140,
      className: "text-center",
    },
    {
      title: "重发情况",
      index: "hasResend",
      type: "badge",
      badge: {
        true: { text: "已重发", color: "success" },
        false: { text: "未重发", color: "error" },
      },
      width: 100,
      className: "text-center",
    },
    {
      title: "渠道号",
      index: "channelNumber",
      width: 200,
      className: "text-center",
    },
    {
      title: "发送账号",
      render: "tpl-account",
      width: 152,
      className: "text-center",
      // iif: () => this.searchOptions.appTypeId === 4,
    },
    {
      title: {
        text: "接收时间",
        optionalHelp: "系统接收消息批次的时间",
      },
      index: "postTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      width: 200,
      className: "text-center",
    },
    {
      title: {
        text: "提交时间",
        optionalHelp: "系统将消息提交到渠道商的时间",
      },
      index: "submitTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      width: 200,
      className: "text-center",
    },
    {
      title: {
        text: "送达时间",
        optionalHelp: "返回状态报告的时间，若提交失败，则为提交失败时间",
      },
      index: "doneTime",
      type: "date",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      width: 200,
      className: "text-center",
    },
  ];

  res: STRes = {
    process: (data, rawData) => {
      if (rawData.extparams && rawData.extparams.hisSuffixOffset) {
        this.hisSuffixOffset = rawData.extparams.hisSuffixOffset;
      }
      data.forEach(item => {
        item.aimJobName = isJsonString(item.parameters) ? JSON.parse(item.parameters)?.aimJobName : "";
        const param = JSON.parse(item.parameters) ? JSON.parse(item.parameters) : {};
        item.aimNumberCheckStatus = param["aimNumberCheckStatus"] ? param["aimNumberCheckStatus"] : 0;
        if (item.firstReplyContent) {
          item.firstReplyContent = JSON.parse(item.firstReplyContent)?.content || "";
        }
      });
      return data;
    },
  };

  req: STReq = {
    method: "POST",
    allInBody: true,
    body: this.q,
    lazyLoad: true,
    process: (requestOptions: STRequestOptions) => {
      requestOptions.body.params.hisSuffixOffset = this.hisSuffixOffset;
      return requestOptions;
    },
  };

  // 选中的数据
  selectedRows: STData[] = [];

  /*searchOptions*/
  searchOptions: any = {
    aimTplId: "",
    aimTplName: "",
    appTypeId: -1,
    channelNumber: "",
    carrier: {
      carrierId: -1,
      carriers: [
        {
          label: "全部",
          value: -1,
        },
        {
          label: "移动",
          value: 1,
        },
        {
          label: "联通",
          value: 2,
        },
        {
          label: "电信",
          value: 3,
        },
      ],
    },
    bizFormStates: {
      bizFormState: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "核验成功", value: 1 },
        { label: "核验失败", value: 2 },
      ],
    },
    sendResults: {
      sendResult: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "成功", value: 1 },
        { label: "失败", value: 2 },
        { label: "未知", value: 3 },
      ],
    },
    hasResends: {
      hasResend: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "已重发", value: 1 },
        { label: "未重发", value: 0 },
      ],
    },
    packName: "",
    phone: "",
    account: "",
    moResults: {
      moResult: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "已上行", value: 1 },
        { label: "未上行", value: 2 },
      ],
    },
    dateRange: [getStartDate(new Date(), 6), getEndDate(new Date(), 0)],
    signatureTypes: {
      signatureType: -2,
      list: [
        { label: "全部", value: -2 },
        { label: "无", value: -1 },
        { label: "通道签名", value: 0 },
        { label: "账号签名", value: 1 },
      ],
    },
    signature: "",
    customerCode: "",
    bizCategories: {
      bizTypeCatId: -1,
      list: [],
    },
    bizTypes: {
      bizType: -1,
      list: [],
    },
  };

  // 当前查看策略详情
  strategyDetail: any = {};
  // 策略发送方式(如有相同意义字段，请替换)
  strategySend = [
    {
      name: "并行（同时发送）",
      type: 2,
    },
    {
      name: "串行（按优先级）",
      type: 1,
    },
  ];
  // 逻辑关系(如有相同意义字段，请替换)
  relationTypes = {
    1: '"与"关系',
    2: '"或"关系',
  };

  isOpenExport = false;
  isOpenContentDetail = false;
  contentLoading = false;
  // 当前查看详情的模板
  currentTemplate: any = [];
  isOpenSendStrategy = false;

  // 等待导出的文件路径列表
  waitingExportFiles: any = [];
  // 存放时间，用于过期
  waitingExportFilesMap: { [key: string]: Date } = {};
  downloadPath = URLS.attachment.url + "?module=10&attach=2&path=";
  // 过期时间 10分钟
  expiredTime = 10 * 60 * 60 * 1000;
  // 状态报告描述模块
  IsShowSolution = false;
  solution: any;

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

  showContent(item) {
    const SmsModalDetailComponent = this.messageService.getModalDetailComponent(this.messageService.getMsgTypeByName("sms", true));
    if (SmsModalDetailComponent) {
      this.modal.createStatic(SmsModalDetailComponent, { batch: item }, this.options).subscribe(() => {});
    }
  }

  // 策略详情
  previewStrategyDetail(item: any) {
    this.strategyDetail = item.sendStrategyDTO;
    if (this.strategyDetail.conditions instanceof Array) {
      this.strategyDetail.conditions.forEach(item => {
        if (!item.bindObj) {
          item.bindObj = item.object;
        }
      });
    }
    this.strategyDetail.msgTypeList = [];
    this.strategyDetail.msgTypes = [...new Set(this.strategyDetail.msgTypes.split(","))].join(",");
    this.strategyDetail.msgTypeStrs = [...new Set(this.strategyDetail.msgTypeStrs)];
    const arr = this.strategyDetail.msgTypes.split(",");
    arr.forEach(str => {
      let o = this.messageService.getMsgList().find((obj: any) => obj.type == +str);
      this.strategyDetail.msgTypeList.push(o);
    });
    this.isOpenSendStrategy = true;
  }

  _handleClose() {
    this.isOpenContentDetail = false;
  }

  closeStrageModal() {
    this.isOpenSendStrategy = false;
  }

  ngOnInit() {
    // 获取参数， 使用 queryParams
    this.queryParams.id = this.route.snapshot.queryParams.id || "";
    this.batchName = this.route.snapshot.queryParams.batchName || "";
    this.searchOptions.appTypeId = +encodeURIComponent(this.route.snapshot.queryParams.appTypeId || 1);
    this.queryParams.isDetail = this.route.snapshot.queryParams.isDetail || false;
    this.q.params.packId = this.queryParams.id;
    this.queryParams.shardTime = new Date(this.route.snapshot.queryParams.shardTime) || new Date();
    this.q.params.shardTime = this.queryParams.shardTime;
    let start = new Date(this.queryParams.shardTime.getTime() - 24 * 60 * 60 * 1000); // 前一天
    let end = new Date(this.queryParams.shardTime.getTime() + 24 * 60 * 60 * 1000); // 后一天
    const msgConf = this.messageService.getMessageConfigByName("sms");
    if (msgConf && this.searchOptions.appTypeId != -1) {
      this.appTypeKey = msgConf.appType.find(item => item.id == this.searchOptions.appTypeId)?.en_name;
    }

    if (this.queryParams.isDetail) {
      this.q.params.start = format(getStartDate(start, 0), "yyyy-MM-dd HH:mm:ss");
      this.q.params.end = format(getEndDate(end, 0), "yyyy-MM-dd HH:mm:ss");
      this.searchOptions.dateRange = [getStartDate(start, 0), getEndDate(end, 0)];
      this.url = URLS.smsSendRecordDetail.url;
    }
    // 区分发送记录与发送详情 权限不同
    this.requestBizCategories(this.queryParams.isDetail ? URLS.bizCatsSendRecord.url : URLS.bizCatsSendDetail.url);
    this.requestBizTypes(this.queryParams.isDetail ? URLS.bizsSendRecord.url : URLS.bizsSendDetail.url);
  }

  ngAfterViewInit(): void {
    this.getTableList();
  }

  requestBizCategories(url) {
    const searchEnums = [{ label: "全部", value: -1 }];
    this.http.post(url, MSG_TYPE).subscribe(res => {
      if (res.status === 0) {
        res.data.forEach(bizCat => {
          searchEnums.push({ label: bizCat.bizCatName, value: bizCat.id });
        });
        this.searchOptions.bizCategories.list = searchEnums;
      }
    });
  }

  requestBizTypes(url) {
    const searchEnums = [{ label: "全部", value: -1 }];
    this.http.post(url, MSG_TYPE).subscribe(res => {
      if (res.status === 0) {
        res.data.forEach(biz => {
          searchEnums.push({ label: biz.name, value: biz.id });
        });
        this.searchOptions.bizTypes.list = searchEnums;
      }
    });
  }

  queryStatistical() {
    // 查询统计数据
    if (this.queryParams.isDetail) {
      this.http
        .post(URLS.sendRecordDetail.url, {
          packId: this.q.params.packId,
          start: this.searchOptions.dateRange.length >= 1 ? format(this.searchOptions.dateRange[0], "yyyy-MM-dd HH:mm:ss") : null,
          end: this.searchOptions.dateRange.length >= 2 ? format(this.searchOptions.dateRange[1], "yyyy-MM-dd HH:mm:ss") : null,
        })
        .subscribe(res => {
          if (res.status === 0) {
            res.data.forEach(value => {
              if (value.msgType == 0) {
                this.searchOptions.appTypeId = value.appTypeId || 1;
                this.queryParams.sentCount = value.msgCount || 0;
                this.queryParams.validTickets = value.validTickets || 0;
                this.queryParams.successCount = value.successCount || 0;
                this.queryParams.failCount = value.failureCount || 0;
                this.queryParams.unknownCount = value.unknownNum || 0;
                this.queryParams.moCount = value.moCount || 0;
                this.queryParams.invalidTickets = value.invalidTickets || 0;
                this.queryParams.validTicketsFail = value.validTicketsFail || 0;
              }
            });
          }
        });
    }
  }

  multiLineDisplay(list, rows) {
    let resultStr = "";
    let br = "<br />";
    if (list && list instanceof Array) {
      for (let i = 0; i < list.length; i++) {
        if (rows <= 0) {
          resultStr += list[i].name + br;
        } else if (i < rows) {
          resultStr += list[i].name + br;
        } else {
          resultStr = resultStr.slice(0, resultStr.length - br.length) + "...";
          break;
        }
      }
      if (rows <= 0 || list.length <= rows) {
        resultStr = resultStr.slice(0, resultStr.length - br.length);
      }
    }
    return resultStr;
  }

  getTableList() {
    this.hisSuffixOffset = "";
    this.queryStatistical();

    if (differenceInCalendarDays(this.searchOptions.dateRange[0], this.searchOptions.dateRange[1]) > 30) {
      this.dialogService.notification.warning("发送详情", "接收时间范围超过31天限制！");
      return;
    }

    this.st.reset({
      params: { hisSuffixOffset: this.hisSuffixOffset, ...this.getSearchParams() },
    });
  }

  getSearchParams() {
    return {
      aimTplId: this.searchOptions.aimTplId,
      aimTplName: this.searchOptions.aimTplName,
      batchName: this.batchName,
      packId: this.q.params.packId,
      shardTime: this.q.params.shardTime,
      sendResult: this.searchOptions.sendResults.sendResult,
      hasResend: this.searchOptions.hasResends.hasResend,
      bizFormState: this.searchOptions.bizFormStates.bizFormState,
      carrierId: this.searchOptions.carrier.carrierId,
      packName: this.searchOptions.packName,
      phone: this.searchOptions.phone,
      moResult: this.searchOptions.moResults.moResult,
      appTypeId: this.searchOptions.appTypeId,
      channelNumber: this.searchOptions.channelNumber,
      account: this.searchOptions.account,
      start: this.searchOptions.dateRange.length >= 1 ? format(this.searchOptions.dateRange[0], "yyyy-MM-dd HH:mm:ss") : null,
      end: this.searchOptions.dateRange.length >= 2 ? format(this.searchOptions.dateRange[1], "yyyy-MM-dd HH:mm:ss") : null,
      signatureType: this.searchOptions.signatureTypes.signatureType,
      signature: this.searchOptions.signature,
      customerCode: this.searchOptions.customerCode,
      bizTypeCatId: this.searchOptions.bizCategories.bizTypeCatId,
      bizType: this.searchOptions.bizTypes.bizType,
    };
  }

  resetTableList() {
    // 重置搜索条件
    this.hisSuffixOffset = "";
    this.searchOptions.sendResults.sendResult = this.searchOptions.sendResults.list[0].value;
    this.searchOptions.hasResends.hasResend = -1;
    this.searchOptions.bizFormStates.bizFormState = -1;
    this.searchOptions.carrier.carrierId = -1;
    this.searchOptions.packName = "";
    this.searchOptions.channelNumber = "";
    this.searchOptions.phone = "";
    this.searchOptions.account = "";
    this.searchOptions.signatureTypes.signatureType = -2;
    this.searchOptions.signature = "";
    this.searchOptions.aimTplId = "";
    this.searchOptions.aimTplName = "";
    this.searchOptions.customerCode = "";
    this.searchOptions.moResults.moResult = this.searchOptions.moResults.list[0].value;
    this.searchOptions.bizCategories.bizTypeCatId = -1;
    this.searchOptions.bizTypes.bizType = -1;
    if (this.queryParams.isDetail) {
      let start = new Date(this.queryParams.shardTime.getTime() - 24 * 60 * 60 * 1000); // 前一天
      let end = new Date(this.queryParams.shardTime.getTime() + 24 * 60 * 60 * 1000); // 后一天
      this.searchOptions.dateRange = [getStartDate(start, 0), getEndDate(end, 0)];
    } else {
      this.searchOptions.dateRange = [getStartDate(new Date(), 6), getEndDate(new Date(), 0)];
    }
    // 重新加载table数据
    this.getTableList();
  }

  goExport() {
    this.router.navigateByUrl("/system/import-export/export");
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
      .post(URLS.smsSendDetailExport.url, {
        params: this.getSearchParams(),
      })
      .subscribe(res => {
        if (res.status === 0) {
          this.isOpenExport = true;
        } else {
          this.dialogService.notification.error("导出", res.errorMsg);
        }
      });
  }

  showSolution(item) {
    if (!item.stateReportDescription) return false;
    this.IsShowSolution = true;
    this.solution = item.solution;
  }

  closeShowSolution() {
    this.IsShowSolution = false;
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

  // 获取上行内容详情
  getMoContent(packId: string) {
    this.http.get(URLS.getMoContent.url + "?packId=" + packId).subscribe(
      res => {
        if (res.status === 0) {
          this.openMoContentModal(res.data.content);
        } else {
          this.dialogService.notification.error("获取上行内容详情失败", res.errorMsg);
        }
      },
      error => {
        this.dialogService.notification.error("获取上行内容详情失败", error.errorMsg);
      },
    );
  }

  openMoContentModal(content) {
    const SmsModalDetailComponent = this.messageService.getModalDetailComponent(this.messageService.getMsgTypeByName("sms", true));
    if (SmsModalDetailComponent) {
      this.modal
        .createStatic(
          SmsModalDetailComponent,
          {
            moContent: isJsonString(content) ? JSON.parse(content).content : content,
            isMo: true,
          },
          this.options,
        )
        .subscribe(() => {});
    }
  }

  // 重发
  resend() {
    if (this.st.total === 0) {
      this.dialogService.notification.warning("消息重发", "暂无消息可重发！");
      return;
    }
    // 可重发的消息数组
    let resendMsgList =
      this.selectedRows.filter(item => {
        return item.result === 2 || item.result === 3 || item.result === null;
      }) || [];
    // 包装重发消息列表
    resendMsgList =
      resendMsgList.map(item => {
        return {
          ticketId: item.ticketId,
          postTime: item.postTime,
          msgType: item.msgType,
          batchName: item.batchName,
        };
      }) || [];

    // 有勾选消息
    if (this.selectedRows && this.selectedRows.length) {
      if (resendMsgList && resendMsgList.length) {
        // 1. 勾选消息中包含失败的消息
        this.getResendCount(resendMsgList, false);
      } else {
        // 2. 勾选的消息中均成功
        const options = {
          confirmValue: "好的",
          confirm: () => {},
          showCancel: false,
        };
        this.dialogService.modal.confirm(`选中的消息中没有失败的消息`, "请重新选择", options);
      }
    } else {
      // 3. 没有勾选任何消息（需要对全部失败的消息进行重发）
      this.getResendCount([], true);
    }
  }

  // 获取重发数量统计
  getResendCount(resendMsgList: any[], resendAll: boolean) {
    const param = {
      msgType: 0,
      appTypeId: this.searchOptions.appTypeId,
      resendAll: resendAll,
      dataList: resendAll ? [] : resendMsgList,
      searchParams: resendAll ? this.getSearchParams() : null,
    };
    this.http.post(URLS.resendMsgCount.url, param).subscribe(res => {
      if (res.status === 0) {
        let terminalIdCount = res.data.terminalIdCount || 0;
        let messageCount = res.data.messageCount || 0;
        if (terminalIdCount) {
          const options = {
            confirm: () => {
              this.handleResend([...resendMsgList], resendAll);
            },
          };
          let message = `
          <p style="text-align:center;margin:0;">${resendAll ? "您没有进行勾选，是否对全部失败消息进行重发？<br />" : ""}信息预计将发送给</p>
          <p style="text-align:center;margin:0; color: rgb(87,137,249); font-weight: 600; letter-spacing: 1px;">${terminalIdCount}个收信人，共${messageCount}条</p>`;
          if (!resendAll) {
            message += `<p style="text-align:center;margin:0;">消息类型为 ${this.msgName}，您确定要全部重新发送吗？</p>`;
          }
          this.dialogService.modal.confirm(message, "", options);
        } else {
          // 2. 勾选的消息中均成功
          const options = {
            confirmValue: "好的",
            confirm: () => {},
            showCancel: false,
          };
          this.dialogService.modal.confirm(`选中的消息中没有失败的消息`, "请重新选择", options);
        }
      } else {
        this.dialogService.notification.error("获取重发消息统计", res.errorMsg);
      }
    });
  }

  // 处理重发操作
  handleResend(resendMsgList: any[], resendAll: boolean) {
    const param = {
      msgType: 0,
      appTypeId: this.searchOptions.appTypeId,
      resendAll: resendAll,
      dataList: resendAll ? [] : resendMsgList,
      searchParams: resendAll ? this.getSearchParams() : null,
    };
    // 发送重发请求
    this.http.post(URLS.resendMsg.url, param).subscribe(res => {
      if (res.status === 0) {
        this.dialogService.notification.success("重发消息", "平台接收成功，请稍后查看消息记录");
        this.st.reload();
        this.selectedRows = [];
      } else {
        this.dialogService.notification.error("重发消息", res.errorMsg);
      }
    });
  }

  templateView(record: any) {
    let aimJobCode = JSON.parse(record.parameters)?.aimJobCode || "";
    this.tplId = aimJobCode
      ? JSON.stringify({
          aimJobCode: aimJobCode,
          phoneNumber: record.terminalId,
        })
      : record.tplId;
    this.isTemplateView = true;
  }

  onCancel() {
    this.isTemplateView = false;
  }
}
