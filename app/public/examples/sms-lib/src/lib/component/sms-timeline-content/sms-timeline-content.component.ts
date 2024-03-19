import { Component, Injectable } from "@angular/core";
import { isJsonString, MsgTimelineContent, TimelineSourceData } from "@icc/common-lib";
import { MSG_TYPE } from "../../shared/constant/msgType";

@Component({
  selector: "icc-sms-timeline-content",
  templateUrl: "./sms-timeline-content.component.html",
  styles: [".left-align {text-align:left;}"],
})
export class SmsTimelineContentComponent implements MsgTimelineContent {
  constructor() {}
  static SCENE = "icc-msg-timeline-content";
  type = MSG_TYPE;
  isAim: boolean;
  isMo: boolean;
  content: string;
  tplId: string;

  /* 赋值 */
  setData(data: TimelineSourceData) {
    this.isMo = data.isMo;
    this.tplId = data.tplId;
    this.isAim = !!this.tplId;
    if (this.isMo) {
      this.content = isJsonString(data.content) ? JSON.parse(data.content).content : data.content;
    } else {
      this.content = data.content || "【短信内容为空】";
    }
  }
}
