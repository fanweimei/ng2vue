import { Component, OnInit } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../shared/constant/interface";
import { MSG_APPTYEP, MSG_TYPE } from "../../shared/constant/msgType";

// M 消息键值
const SMS_AIM_MSG_TYPE = MSG_APPTYEP.aim;

@Component({
  selector: "icc-sms-modal-detail",
  templateUrl: "./sms-modal-detail.component.html",
  styleUrls: ["./sms-modal-detail.component.less"],
})
export class SmsModalDetailComponent implements OnInit {
  constructor(private http: _HttpClient, private dialogService: DialogService) {}
  static SCENE = "icc-msg-modal-detail";
  type = MSG_TYPE;
  isMo: boolean;
  title: string;
  // 上行
  moContent: string;
  // 下行
  batch: any;
  listOfData: any[];
  loading: boolean;

  // 注：模板内容展示时，不需要调用短信分段的接口
  isTpl: boolean;
  tplContent: any;

  mtContent: any;
  // M 消息内容
  isAimMsg: boolean;
  varMap: any;
  isSendAudit: boolean = false;
  aimTplId: any;

  ngOnInit() {
    if (this.isSendAudit && this.mtContent && this.aimTplId) {
      this.isTpl = true;
      this.tplContent = this.mtContent;
      return;
    }
    if (!this.isMo && this.batch) {
      if (!this.isTpl) {
        this.loading = true;
        this.listOfData = [];
        this.http.post(URLS.smsSubList.url, this.batch).subscribe(
          res => {
            this.loading = false;
            if (res.status === 0) {
              this.listOfData = res.data;
            } else {
              this.dialogService.notification.error("请求失败", "获取短信发送内容失败！");
            }
          },
          error => {
            this.loading = false;
            this.dialogService.notification.error("请求失败", error.errorMsg);
          },
        );
      } else {
        this.isTpl = true;
      }
    }
    if (!this.isMo && this.mtContent) {
      this.isTpl = true;
      this.tplContent = this.mtContent;
    }
  }
}
