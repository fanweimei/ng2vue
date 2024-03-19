import { Component, OnInit } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { DialogService, MsgTemplateDetail } from "@icc/common-lib";
import { URLS } from "../../shared/constant/interface";
import { MSG_APPTYEP, MSG_TYPE } from "../../shared/constant/msgType";

// 普通消息键值
const SMS_COMMON_MSG_TYPE = MSG_APPTYEP.common;
// M 消息键值
const SMS_AIM_MSG_TYPE = MSG_APPTYEP.aim;

@Component({
  selector: "icc-sms-tpl-detail",
  templateUrl: "./sms-tpl-detail.component.html",
  styleUrls: ["./sms-tpl-detail.component.less"],
})
export class SmsTplDetailComponent implements OnInit, MsgTemplateDetail {
  constructor(private http: _HttpClient, private dialogService: DialogService) {}
  static SCENE = "icc-msg-tpl-detail";

  data;

  /** 是否是M消息 */
  isAimMsg = true;

  // 短信签名
  signature;

  type: number = MSG_TYPE;

  ngOnInit(): void {
    this.getUserSignature();
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

  setData(item): void {
    this.data = item;

    const { applicationTypeList } = this.data;
    this.isAimMsg = applicationTypeList.includes(SMS_AIM_MSG_TYPE);
    if (this.isAimMsg) {
      this.data.templates?.forEach(tpl => {
        this.generateFailContent(tpl);
      });
    }
  }

  // 生成解析失败内容
  generateFailContent(tpl: any) {
    tpl.failContent = {
      fileContent: (this.signature ? "【" + this.signature + "】" : "") + (tpl.content || "") + (tpl.varMap?.aimUrl ? " " + tpl.varMap?.aimUrl : ""),
      shortUrlStrategy: tpl.requireShortUrl
        ? {
            longUrlName: tpl.longUrlName,
            longUrl: tpl.longUrl,
            serverUrl: tpl.serverUrl,
            traceType: tpl.traceType,
          }
        : null,
    };
  }
}
