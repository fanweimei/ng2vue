import { Component, OnInit } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd/modal";
import { UntypedFormArray, Validators, UntypedFormControl, UntypedFormGroup, UntypedFormBuilder, AbstractControl } from "@angular/forms";
import { _HttpClient } from "@delon/theme";
import { Observable, of } from "rxjs";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../../shared/constant/interface";

@Component({
  selector: "app-view",
  templateUrl: "./view.component.html",
  styleUrls: ["./view.component.less"],
})
export class ChannelAutoSwitchViewComponent implements OnInit {
  static NAME = "icc-msg-channel-change-view";

  constructor(private fb: UntypedFormBuilder, private http: _HttpClient, private modal: NzModalRef, private dialogService: DialogService) {}

  subject = "自动切换配置";
  operation = "查看详情";
  record: any;

  channelAutoSwitch: any = {
    id: "",
    channelId: "",
    parentChannelId: 0,
    channelNum: "",
    carrierName: "",
    carriers: "",
    extendNumLength: "",
    providerName: "",
    backupChannels: [],
    enableStatus: false,
    disconnectEnabled: true,
    disconnectMinutes: "",
    recoveryMinutes: "",
    packSuccessRateEnabled: false,
    packWithinMinutes: "",
    packFailCountReached: "",
    packFailRateUnder: "",
    errorCodeEnabled: false,
    channelErrorCodes: [],
    supportProvincesStr: "",
  };
  mainChannels: any = [];
  backupChannels: any = [];
  allChannels: any = [];
  // 备用渠道
  editIndex = -1;
  editObj = {};

  form: UntypedFormGroup;
  configForm: UntypedFormGroup;

  ngOnInit(): void {
    this.initForm();
    this.init();
  }

  // 初始化信息
  init() {
    this.channelAutoSwitch = this.record;
    this.initChannelInfo(this.record.channelId);
    // 切换配置回显
    this.resetConfigValue(this.record);
  }

  getChannelInfo(isAllChannel: boolean, channelId: any, isMainChannel: boolean) {
    this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + isAllChannel + "/" + channelId + "/" + isMainChannel).subscribe(res => {
      if (res.status === 0) {
        if (isAllChannel) {
          this.allChannels = res.data;
        } else {
          if (isMainChannel) {
            this.mainChannels = res.data;
            if (this.channelAutoSwitch.channelId && this.channelAutoSwitch.channelId > 0 && this.channelAutoSwitch.channelId !== "") {
              // 修改时，主渠道回显
              this.mainChannelChange(this.channelAutoSwitch.channelId);
            }
          } else {
            this.backupChannels = res.data;
            // 修改时， 备用渠道回显
            if (this.channelAutoSwitch.backupChannels && this.channelAutoSwitch.backupChannels.length > 0) {
              for (let backup of this.channelAutoSwitch.backupChannels) {
                let backupChannel = this.createChannel();
                this.setItemDisabled(backupChannel);
                backupChannel.get("channelId")?.setValue(backup.channelId);
                this.backupChannelChange(backup.channelId, backupChannel);
                this.items.push(backupChannel);
                this.editItem(this.items.length - 1);
                this.saveItem2(this.items.length - 1);
              }
            }
          }
        }
      } else {
        this.dialogService.notification.error(this.subject, "获取渠道信息失败");
      }
    });
  }

  initChannelInfo(channelId) {
    this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + true + "/" + 0 + "/" + false).subscribe(res => {
      if (res.status === 0) {
        // 全部渠道
        this.allChannels = res.data;
        // 主渠道赋值
        this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + false + "/" + channelId + "/" + true).subscribe(resp => {
          if (resp.status === 0) {
            this.mainChannels = resp.data;
            if (this.channelAutoSwitch.channelId && this.channelAutoSwitch.channelId > 0 && this.channelAutoSwitch.channelId !== "") {
              // 修改时，主渠道回显
              this.mainChannelChange(this.channelAutoSwitch.channelId);
            }
          } else {
            this.dialogService.notification.error(this.subject, "获取渠道信息失败");
          }
        });
      } else {
        this.dialogService.notification.error(this.subject, "获取渠道信息失败");
      }
    });
  }

  resetConfigValue(channelAutoSwitch) {
    this.configForm.get("disconnectEnabled")?.setValue(channelAutoSwitch.disconnectEnabled);
    this.configForm.get("disconnectMinutes")?.setValue(channelAutoSwitch.disconnectMinutes);
    this.configForm.get("recoveryMinutes")?.setValue(channelAutoSwitch.recoveryMinutes);
    this.configForm.get("packSuccessRateEnabled")?.setValue(channelAutoSwitch.packSuccessRateEnabled);
    this.configForm.get("packWithinMinutes")?.setValue(channelAutoSwitch.packWithinMinutes);
    this.configForm.get("packFailCountReached")?.setValue(channelAutoSwitch.packFailCountReached);
    this.configForm.get("packFailRateUnder")?.setValue(channelAutoSwitch.packFailRateUnder);
    this.configForm.get("errorCodeEnabled")?.setValue(channelAutoSwitch.errorCodeEnabled);
    if (channelAutoSwitch.channelErrorCodes && channelAutoSwitch.channelErrorCodes.length > 0) {
      for (let errorCode of channelAutoSwitch.channelErrorCodes) {
        let errorItem = this.createErrorItem();
        errorItem.get("errorCode")?.setValue(errorCode.errorCode);
        errorItem.get("errorCount")?.setValue(errorCode.errorCount);
        errorItem.get("durationMinutes")?.setValue(errorCode.durationMinutes);
        this.errorItems.push(errorItem);
      }
    }
  }

  // 初始化表单
  initForm() {
    this.form = this.fb.group({
      items: this.fb.array([]),
    });

    this.configForm = this.fb.group({
      disconnectEnabled: new UntypedFormControl(true),
      disconnectMinutes: new UntypedFormControl("5", [Validators.min(1), Validators.max(60), Validators.pattern("^[0-9]*$"), Validators.required]),
      recoveryMinutes: new UntypedFormControl("5", [Validators.min(1), Validators.max(60), Validators.pattern("^[0-9]*$"), Validators.required]),
      packSuccessRateEnabled: new UntypedFormControl(false),
      packWithinMinutes: new UntypedFormControl("", [Validators.min(1), Validators.max(60), Validators.pattern("^[0-9]*$"), Validators.required]),
      packFailRateUnder: new UntypedFormControl("", [Validators.min(0), Validators.max(98), Validators.pattern("^[0-9]*$"), Validators.required]),
      packFailCountReached: new UntypedFormControl("", [Validators.min(1), Validators.max(100000), Validators.required, Validators.pattern("^[0-9]*$")]),
      errorCodeEnabled: new UntypedFormControl(false),
      errorItems: this.fb.array([]),
    });
  }

  mainChannelChange(channelId) {
    let channel = this.getChannelById(channelId);
    // 每次切换都会清空备用通道
    this.mainChannelValue(channel);
    this.getChannelInfo(false, channelId, false);
    this.editIndex = -1;
  }

  mainChannelValue(channel) {
    this.channelAutoSwitch.channelNum = channel.channelNum;
    this.channelAutoSwitch.extendNumLength = channel.extendNumLength;
    this.channelAutoSwitch.carrierName = this.getCarrierNameByCarrierId(channel.carrierId);
    this.channelAutoSwitch.carriers = channel.carriers.map(carrierId => this.getCarrierNameByCarrierId(carrierId)).join(",");
    this.channelAutoSwitch.providerName = channel.providerName;
    this.channelAutoSwitch.supportProvincesStr = channel.supportProvincesStr.replace(/、/g, ",");
  }

  // 备用通道配置
  backupChannelChange(channelId, item: AbstractControl) {
    let channel = this.getChannelById(channelId);
    item.get("channelName")?.setValue(channel.name);
    item.get("channelNum")?.setValue(channel.channelNum);
    item.get("providerName")?.setValue(channel.providerName);
    item.get("extendNumLength")?.setValue(channel.extendNumLength);
    let carrierName = this.getCarrierNameByCarrierId(channel.carrierId);
    item.get("carrierName")?.setValue(carrierName);
    let carriers = channel.carriers.map(carrierId => this.getCarrierNameByCarrierId(carrierId)).join(",");
    item.get("carriers")?.setValue(carriers);
    item.get("supportProvincesStr")?.setValue(channel.supportProvincesStr.replace(/、/g, ","));
  }

  createChannel(): UntypedFormGroup {
    return this.fb.group({
      channelName: new UntypedFormControl("", Validators.required),
      channelId: new UntypedFormControl("", Validators.required),
      channelNum: new UntypedFormControl("", Validators.required),
      providerName: new UntypedFormControl("", Validators.required),
      carrierName: new UntypedFormControl("", Validators.required),
      carriers: new UntypedFormControl("", Validators.required),
      extendNumLength: new UntypedFormControl("", Validators.required),
      supportProvincesStr: new UntypedFormControl("", Validators.required),
    });
  }

  get items() {
    return this.form.controls.items as UntypedFormArray;
  }

  setItemDisabled(backupChannel) {
    backupChannel.get("channelNum").disable({
      onlySelf: true,
      emitEvent: true,
    });
    backupChannel.get("providerName").disable({
      onlySelf: true,
      emitEvent: true,
    });
    backupChannel.get("extendNumLength").disable({
      onlySelf: true,
      emitEvent: true,
    });
    backupChannel.get("carrierName").disable({
      onlySelf: true,
      emitEvent: true,
    });
    backupChannel.get("carriers").disable({
      onlySelf: true,
      emitEvent: true,
    });
    backupChannel.get("supportProvincesStr").disable({
      onlySelf: true,
      emitEvent: true,
    });
  }

  editItem(index: number) {
    if (this.editIndex !== -1 && this.editObj) {
      this.items.at(this.editIndex).patchValue(this.editObj);
    }
    this.editObj = { ...this.items.at(index).value };
    this.editIndex = index;
  }

  saveItem2(index: number) {
    this.items.at(index).markAsDirty();
    if (this.items.at(index).invalid) return;
    this.editIndex = -1;
  }

  // 渠道自动切换配置
  createErrorItem(): UntypedFormGroup {
    return this.fb.group({
      errorCode: new UntypedFormControl("", Validators.required),
      errorCount: new UntypedFormControl("", [Validators.required, Validators.min(1), Validators.max(1000), Validators.pattern("^[0-9]*$")]),
      durationMinutes: new UntypedFormControl("", [Validators.required, Validators.min(1), Validators.max(60), Validators.pattern("^[0-9]*$")]),
    });
  }

  get errorItems() {
    return this.configForm.controls.errorItems as UntypedFormArray;
  }

  close() {
    this.modal.close(true);
  }

  // 运营商转换
  getCarrierNameByCarrierId(carrierId): string {
    if (carrierId === 1) {
      return "移动";
    } else if (carrierId === 2) {
      return "联通";
    } else if (carrierId === 3) {
      return "电信";
    } else {
      return "未定义";
    }
  }

  getChannelById(channelId): any {
    for (let channel of this.allChannels) {
      if (channel.id === channelId) {
        return channel;
      }
    }
    return {};
  }
}
