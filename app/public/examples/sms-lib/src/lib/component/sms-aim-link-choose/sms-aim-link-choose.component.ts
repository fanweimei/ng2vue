import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { URLS } from "../../shared/constant/interface";
import { DialogService, getEndDate, getStartDate } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { STChange, STColumn, STComponent, STData, STPage, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { format } from "date-fns";

@Component({
  selector: "app-sms-aim-link-choose",
  templateUrl: "./sms-aim-link-choose.component.html",
  styleUrls: ["./sms-aim-link-choose.component.less"],
})
export class SmsAimLinkChooseComponent implements AfterViewInit {
  constructor(private modal: NzModalRef, public http: _HttpClient, private dialogService: DialogService) {}

  @ViewChild("st", { static: false }) st: STComponent;

  subject: string = "M消息链接选择";

  // 已选择的模板id
  templateId: string = "";

  // 展开 flag
  expandForm: boolean = false;
  // 搜索项
  searchOptions: any = {
    linkType: 1,
    jobName: "",
    aimUrl: "",
    creator: "",
    // generateNum: null,
    // unresolvedNum: null,
    startExpireTime: null,
    endExpireTime: null,
    linkStatus: 2,
  };

  // 列表参数
  url = URLS.getAimLinkList.url;
  selectedRows: STData | null = null;
  total = 0;
  req: STReq = {
    method: "POST",
    allInBody: true,
    lazyLoad: true,
    body: {
      params: {
        templateId: this.templateId,
        linkType: this.searchOptions.linkType,
        linkStatus: this.searchOptions.linkStatus,
        jobName: this.searchOptions.jobName,
        aimUrl: this.searchOptions.aimUrl,
        creator: this.searchOptions.creator,
        startExpireTime: this.searchOptions.startExpireTime ? format(new Date(this.searchOptions.startExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
        endExpireTime: this.searchOptions.endExpireTime ? format(new Date(this.searchOptions.endExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
      },
    },
    process: (requestOptions: STRequestOptions) => {
      return requestOptions;
    },
  };
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
      type: "radio",
      width: 50,
      fixed: "left",
      className: "text-center",
    },
    {
      title: "链接任务名称",
      render: "tpl-jobName",
      width: 132,
      className: "text-center",
    },
    {
      title: "短信签名",
      className: "text-break text-center",
      render: "multi-sign",
      width: 150,
    },
    {
      title: "M消息链接",
      render: "tpl-aimUrl",
      iif: () => this.searchOptions.linkType === 1,
      width: 132,
      className: "text-center",
    },
    {
      title: "生成数量",
      render: "tpl-generateNum",
      width: 132,
      className: "text-center",
    },
    {
      title: "剩余解析数量",
      render: "tpl-unresolvedNum",
      width: 132,
      className: "text-center",
    },
    {
      title: "创建人",
      render: "tpl-creator",
      width: 132,
      className: "text-center",
    },
    {
      title: "创建时间",
      index: "createTime",
      type: "date",
      width: 140,
      dateFormat: "yyyy-MM-dd",
      className: "text-center",
    },
    {
      title: "到期时间",
      index: "expireTime",
      type: "date",
      width: 140,
      dateFormat: "yyyy-MM-dd",
      className: "text-center",
    },
  ];

  ngAfterViewInit(): void {
    this.resetTableList();
  }

  getTableList() {
    this.st.reset({
      params: {
        templateId: this.templateId,
        linkType: this.searchOptions.linkType,
        linkStatus: this.searchOptions.linkStatus,
        jobName: this.searchOptions.jobName,
        aimUrl: this.searchOptions.aimUrl,
        creator: this.searchOptions.creator,
        startExpireTime: this.searchOptions.startExpireTime ? format(new Date(this.searchOptions.startExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
        endExpireTime: this.searchOptions.endExpireTime ? format(new Date(this.searchOptions.endExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
      },
    });
  }

  resetSearchOptions() {
    // 重置搜索条件
    this.searchOptions.jobName = "";
    this.searchOptions.aimUrl = "";
    this.searchOptions.creator = "";
    // this.searchOptions.generateNum = null;
    // this.searchOptions.unresolvedNum = null;
    // format(getStartDate(new Date(), 6), "yyyy-MM-dd HH:mm:ss")
    this.searchOptions.startExpireTime = null;
    this.searchOptions.endExpireTime = null;
  }

  resetTableList() {
    this.resetSearchOptions();
    // 重新加载table数据
    this.getTableList();
  }

  stChange(e: STChange) {
    switch (e.type) {
      case "radio":
        this.selectedRows = e.radio || null;
        break;
      case "pi":
        this.selectedRows = null;
        break;
    }
  }

  linkTypeChange($event) {
    this.searchOptions.linkType = $event;
    this.resetSearchOptions();
    this.st.resetColumns({ columns: this.columns, emitReload: true });
    this.getTableList();
  }

  save() {
    if (!this.selectedRows) {
      this.dialogService.notification.warning(this.subject, "请选择M消息链接！");
    }
    let result = {
      linkType: this.searchOptions.linkType,
      ...this.selectedRows,
    };

    this.modal.close(result);
  }

  getSign(item) {
    const signs = item.smsSign.split(",");
    return signs.map(sign => {
      return { name: sign };
    });
  }

  // 设置结束时间为23:59:59
  onOkDate() {
    this.searchOptions.expireTime = this.searchOptions.expireTime ? format(new Date(this.searchOptions.expireTime), "yyyy-MM-dd") : null;
  }

  close() {
    this.modal.destroy();
  }
}
