import { Component, OnInit, Input } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { DialogService } from "@icc/common-lib";
import { MsgTemplateAutoMatch } from "@icc/common-lib";
import { URLS } from "../../shared/constant/interface";
import { MSG_APPTYEP, MSG_TYPE } from "../../shared/constant/msgType";

// M 消息键值
const SMS_AIM_MSG_TYPE = MSG_APPTYEP.aim;
@Component({
  selector: "icc-sms-tpl-auto-match",
  templateUrl: "./sms-tpl-auto-match.component.html",
  styleUrls: ["./sms-tpl-auto-match.component.less"],
})
export class SmsTplAutoMatchComponent implements OnInit, MsgTemplateAutoMatch {
  constructor(private http: _HttpClient, private dialogService: DialogService) {}
  @Input() tplList: any[];
  viewList: any;
  type = MSG_TYPE;

  // 逻辑关系
  relationTypes = {
    1: '"与"关系',
    2: '"或"关系',
  };

  /** 是否是M消息 */
  isAimMsg = true;

  // 短信签名
  signature;

  ngOnInit() {
    // 获取账号签名
    this.getUserSignature();
    this.viewList = this.parseData();
  }

  /* 数据解析 */
  parseData() {
    if (this.tplList && this.tplList.length) {
      if (this.tplList[0]) {
        this.getMsgApplicationType(this.tplList[0].applyId);
      }
    }
    return this.tplList;
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

  // 计算分段
  calcSegments(value) {
    let length = value.length + (this.signature ? this.signature.length + 2 : 0);
    if (length <= 70) {
      return 1;
    } else {
      return Math.ceil(length / 67);
    }
  }

  // 判断是否为 M 消息
  getMsgApplicationType(applyId) {
    this.isAimMsg = applyId === SMS_AIM_MSG_TYPE ? true : false;
  }
}
