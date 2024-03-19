import { Component, OnInit, ViewChild } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd/modal";
import { _HttpClient } from "@delon/theme";
import { URLS } from "../../../shared/constant/interface";
import { STComponent, STColumn, STReq, STRequestOptions, STPage, STRes } from "@delon/abc/st";
import { DialogService } from "@icc/common-lib";

@Component({
  selector: "app-price-rate",
  templateUrl: "./price-rate.component.html",
  styles: [
    `
      .modal-title {
        padding-right: 30px;
      }
    `,
  ],
})
export class SmsChannelPriceRateComponent implements OnInit {
  static SCENE = "icc-msg-channel-price";
  constructor(private modal: NzModalRef, public http: _HttpClient, private dialogService: DialogService) {}

  record: any;
  isShowHistory: any = false;
  priceRate = 0.0;

  url = URLS.SmsChannelManagementPriceRateHistory.url;

  @ViewChild("st", { static: false }) st: STComponent;
  columns: STColumn[] = [
    {
      title: "修改前价格(元)",
      index: "prePriceRate",
    },
    {
      title: "修改后价格(元)",
      index: "afterPriceRate",
    },
    {
      title: "修改时间",
      index: "updateTime",
      type: "date",
      className: "left",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
    },
    {
      title: "修改人",
      index: "updateAccount",
    },
  ];

  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      if (requestOptions.body.params.channelId === undefined) {
        requestOptions.body.params.channelId = this.record.id;
      }

      return requestOptions;
    },
  };

  page: STPage = {};
  res: STRes = {};
  count: any;
  list: any;

  ngOnInit(): void {
    if (this.record && this.record.id > 0) {
      this.http.get(URLS.getSmsChannelManagementPriceRate.url + "/" + this.record.id).subscribe(res => {
        if (res.status === 0) {
          if (res.data.priceRate) {
            this.priceRate = res.data.priceRate;
          }
        } else {
          this.dialogService.notification.error(`渠道管理`, "获取费率失败！");
        }
      });
    }
  }

  showHistory() {
    this.isShowHistory = !this.isShowHistory;
    if (this.isShowHistory) {
      this.getTableList();
    }
  }

  save() {
    this.modal.close(this.priceRate);
  }

  close() {
    this.modal.close(-1);
  }

  getTableList() {
    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        channelId: this.record.id,
      },
    });
  }

  resetTableList() {
    // 重新加载table数据
    this.getTableList();
  }

  change: boolean = false;

  countChange() {
    this.change = true;
  }
}
