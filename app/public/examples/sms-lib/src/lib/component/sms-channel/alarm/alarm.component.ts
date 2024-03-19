import { Component, OnInit } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd/modal";
import { _HttpClient } from "@delon/theme";
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormBuilder } from "@angular/forms";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-alarm",
  templateUrl: "./alarm.component.html",
  styles: [
    `
      .modal-title {
        padding-right: 30px;
      }
    `,
  ],
  styleUrls: ["./alarm.component.less"],
})
export class SmsChannelAlarmComponent implements OnInit {
  static SCENE = "icc-msg-channel-alarm";
  constructor(private modal: NzModalRef, public http: _HttpClient, private dialogService: DialogService, private fb: UntypedFormBuilder) {}

  form: UntypedFormGroup = this.fb.group({
    channelId: new UntypedFormControl(),
    dailyLimitCount: new UntypedFormControl(null, [Validators.max(300000000), Validators.pattern("^[0-9]*$")]),
    monthlyLimitCount: new UntypedFormControl(null, [Validators.max(10000000000), Validators.pattern("^[0-9]*$")]),
    callUserId: new UntypedFormControl(null),
  });

  linkedAccounts: any[] = [];
  account: any = "-1";
  channelId: any = "-1";
  record: any;
  callUserId: any;
  flag = true;

  ngOnInit(): void {
    this.channelId = this.record.id;
    this.getLinkedAccounts();
    this.form.get("channelId")?.setValue(this.record.id);
    if (this.record && this.record.id > 0) {
      this.http.get(URLS.getSmsChannelManagementChannelAlarm.url + "/" + this.record.id).subscribe(res => {
        if (res.status === 0) {
          if (res.data) {
            let dailyLimitCount = res.data.dailyLimitCount;
            let monthlyLimitCount = res.data.monthlyLimitCount;
            this.form.get("dailyLimitCount")?.setValue(dailyLimitCount === -1 ? null : dailyLimitCount);
            this.form.get("monthlyLimitCount")?.setValue(monthlyLimitCount === -1 ? null : monthlyLimitCount);
            this.form.get("callUserId")?.setValue(res.data.callUserId);
            let userIds = res.data.callUserId.split(",");
            let temp: any[] = [];
            for (let userId of userIds) {
              temp.push(Number.parseInt(userId, 0));
            }
            this.callUserId = temp;
            this.flag = false;
          }
        } else {
          this.dialogService.notification.error("预警设置", "获取预警失败");
        }
      });
    }
  }

  getLinkedAccounts() {
    this.http.get(URLS.getSmsChannelManagementChannelAlarmAccount.url + "/" + this.account + "/" + this.channelId).subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        this.linkedAccounts = res.data;
      }
    });
  }

  searchAccount(event) {
    !event || event.trim() === "" ? (this.account = "-1") : (this.account = event);
    this.getLinkedAccounts();
  }

  change1: boolean = false;
  change2: boolean = false;

  countChange(index) {
    let dailyLimitCount = this.form.get("dailyLimitCount")?.value;
    let monthlyLimitCount = this.form.get("monthlyLimitCount")?.value;
    dailyLimitCount || monthlyLimitCount ? (this.flag = false) : (this.flag = true);
    if (index === 1) this.change1 = true;
    if (index === 2) this.change2 = true;
  }

  save() {
    // 当月阈值小于日阈值
    let dailyLimitCount = this.form.get("dailyLimitCount")?.value;
    let monthlyLimitCount = this.form.get("monthlyLimitCount")?.value;
    if (dailyLimitCount && monthlyLimitCount) {
      if (monthlyLimitCount - dailyLimitCount < 1) {
        this.dialogService.notification.error("预警设置", "当月阈值不能小于等于日阈值");
        return;
      }
    }

    if (this.callUserId && this.callUserId.length > 0) {
      this.form.get("callUserId")?.setValue(this.callUserId.join(","));
    } else {
      this.dialogService.notification.error("预警设置", "通知人员不能为空");
      return;
    }
    this.modal.close(this.form.value);
  }

  close() {
    this.modal.close(0);
  }
}
