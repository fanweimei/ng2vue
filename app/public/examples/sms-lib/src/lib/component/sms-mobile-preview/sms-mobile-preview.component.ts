import { Component, OnInit } from "@angular/core";
import { DialogService, MsgMobilePreview, TplPreviewData } from "@icc/common-lib";
import { _HttpClient } from "@delon/theme";
import { URLS } from "../../shared/constant/interface";
import { MSG_TYPE } from "../../shared/constant/msgType";

@Component({
  selector: "icc-sms-mobile-preview",
  templateUrl: "./sms-mobile-preview.component.html",
  styleUrls: ["./sms-mobile-preview.component.less"],
})
export class SmsMobilePreviewComponent implements OnInit, MsgMobilePreview {
  constructor(public http: _HttpClient, private dialogService: DialogService) {}
  static SCENE = "icc-msg-mobile-preview";
  message: any;

  type: number = MSG_TYPE;

  // 短信账号签名
  signature;

  /** 是否是M消息 */
  isAimMsg = true;

  ngOnInit() {
    this.getUserSignature();
  }

  setData(item: TplPreviewData): void {
    this.message = item;
    console.log("this.message :>> ", this.message);
    this.isAimMsg = this.message?.isAim;
  }

  clear(): void {
    // throw new Error('Method not implemented.');
  }

  // 获取账号签名
  getUserSignature() {
    this.http.post(URLS.getUserSignature.url).subscribe(res => {
      if (res.status === 0) {
        this.signature = res.data;
      } else {
        this.dialogService.notification.error("获取账号签名", res.errorMsg);
      }
    });
  }
}
