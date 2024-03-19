import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators, AbstractControl } from "@angular/forms";
import { _HttpClient } from "@delon/theme";
import { URLS } from "../../../../shared/constant/interface";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { DialogService } from "@icc/common-lib";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"],
})
export class ChannelAutoSwitchEditComponent implements OnInit {
  static NAME = "icc-msg-channel-change-edit";

  constructor(
    private fb: UntypedFormBuilder,
    private dialogService: DialogService,
    private http: _HttpClient,
    private _activatedroute: ActivatedRoute,
    private router: Router,
  ) {}

  subject = "自动切换配置";
  operation = "新增";
  channelId = 0;

  channelAutoSwitch: any = {
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
    useStatus: null,
    supportProvincesStr: "",
  };
  mainChannels: any = [];
  backupChannels: any = [];
  allBackupChannels: any = [];
  allChannels: any = [];
  // 备用渠道
  editIndex = -1;
  editObj = {};
  currentChannelId: any = null;
  // 错误代码处理
  editErrorItemIndex = -1;
  editErrorObject = {};

  form: UntypedFormGroup;
  configForm: UntypedFormGroup;
  backChannelAddFlag = false;
  errorCodeAddFlag = false;

  ngOnInit(): void {
    this.initForm();
    this.init();
  }

  // 初始化信息
  init() {
    this._activatedroute.queryParams.subscribe(params => {
      if (params.channelId && params.channelId > 0) {
        this.operation = "编辑";
        this.channelAutoSwitch.channelId = params.channelId;
        this.channelId = params.channelId;
        this.currentChannelId = params.currentChannelId;
        this.http.get(URLS.channelAutoSwitchDetail.url + "/" + params.channelId).subscribe(res => {
          if (res.status === 0) {
            this.channelAutoSwitch = res.data;
            this.initChannelInfo(res.data.channelId);
            // 切换配置回显
            this.resetConfigValue(res.data);
          } else {
            this.dialogService.notification.error(this.subject, `${res.errorMsg}`);
          }
        });
      } else {
        this.initChannelInfo(0);
      }
    });
  }

  /**
   * 请求是异步的，嵌套使用该方法需要注意一下
   * @param isAllChannel
   * @param channelId
   * @param isMainChannel
   */
  getChannelInfo(isAllChannel: boolean, channelId: any, isMainChannel: boolean) {
    this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + isAllChannel + "/" + channelId + "/" + isMainChannel).subscribe(res => {
      if (res.status === 0) {
        if (isAllChannel) {
          this.allChannels = res.data;
        } else {
          if (isMainChannel) {
            this.mainChannels = res.data;
            if (this.channelId > 0 && this.channelAutoSwitch.channelId && this.channelAutoSwitch.channelId > 0 && this.channelAutoSwitch.channelId !== "") {
              // 修改时，主渠道回显
              this.mainChannelChange(this.channelAutoSwitch.channelId);
            }
          } else {
            this.backupChannels = res.data;
            this.allBackupChannels = res.data;
            // 修改时， 备用渠道回显
            if (this.channelId > 0 && this.channelAutoSwitch.backupChannels && this.channelAutoSwitch.backupChannels.length > 0) {
              for (let backup of this.channelAutoSwitch.backupChannels) {
                let backupChannel = this.createChannel();
                this.setItemDisabled(backupChannel);
                backupChannel.get("channelId")?.setValue(backup.channelId);
                this.backupChannelChange(backup.channelId, backupChannel);
                this.items.push(backupChannel);
                this.editItem(this.items.length - 1, false);
                this.saveItem2(this.items.length - 1, false);
              }
            }
          }
        }
      } else {
        this.dialogService.notification.error(this.subject, "获取渠道信息失败");
      }
    });
  }

  /**
   * getChannelInfo方法无法满足嵌套使用
   * 顺序初始化渠道信息，http请求是异步的，只能嵌套使用了
   * @param channelId
   */
  initChannelInfo(channelId) {
    this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + true + "/" + 0 + "/" + false).subscribe(res => {
      if (res.status === 0) {
        // 全部渠道
        this.allChannels = res.data;
        // 主渠道赋值
        this.http.get(URLS.channelAutoSwitchChannelInfo.url + "/" + false + "/" + channelId + "/" + true).subscribe(resp => {
          if (resp.status === 0) {
            this.mainChannels = resp.data;
            if (this.channelId > 0 && this.channelAutoSwitch.channelId && this.channelAutoSwitch.channelId > 0 && this.channelAutoSwitch.channelId !== "") {
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
    this.configForm.get("disconnectMinutes")?.setValue(channelAutoSwitch.disconnectMinutes === 0 ? "" : channelAutoSwitch.disconnectMinutes);
    this.configForm.get("recoveryMinutes")?.setValue(channelAutoSwitch.recoveryMinutes === 0 ? "" : channelAutoSwitch.recoveryMinutes);
    this.configForm.get("packSuccessRateEnabled")?.setValue(channelAutoSwitch.packSuccessRateEnabled);
    this.configForm.get("packWithinMinutes")?.setValue(channelAutoSwitch.packWithinMinutes === 0 ? "" : channelAutoSwitch.packWithinMinutes);
    this.configForm.get("packFailCountReached")?.setValue(channelAutoSwitch.packFailCountReached === 0 ? "" : channelAutoSwitch.packFailCountReached);
    this.configForm.get("packFailRateUnder")?.setValue(channelAutoSwitch.packFailRateUnder === 0 ? "" : channelAutoSwitch.packFailRateUnder);
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
      packFailRateUnder: new UntypedFormControl("", [
        Validators.min(0),
        Validators.max(98),
        // Validators.pattern('\d+(\.\d{1})?'),
        Validators.required,
      ]),
      packFailCountReached: new UntypedFormControl("", [Validators.min(1), Validators.max(100000), Validators.required, Validators.pattern("^[0-9]*$")]),
      errorCodeEnabled: new UntypedFormControl(false),
      errorItems: this.fb.array([]),
    });
  }

  mainChannelChange(channelId) {
    let channel = this.getChannelById(channelId);
    this.mainChannelValue(channel);
    // 备用渠道
    this.getChannelInfo(false, channelId, false);
    this.editIndex = -1;
  }

  mainChannelPageChange(channelId) {
    let channel = this.getChannelById(channelId);
    this.mainChannelValue(channel);
    // 页面每次切换都会清空备用通道，好像现在不能切换
    this.items.clear();
    this.getChannelInfo(false, channelId, false);
    this.editIndex = -1;
  }

  mainChannelValue(channel) {
    this.channelAutoSwitch.channelNum = channel.channelNum;
    this.channelAutoSwitch.extendNumLength = channel.extendNumLength;
    this.channelAutoSwitch.carrierName = this.getCarrierNameByCarrierId(channel.carrierId);
    if (channel.carriers) {
      this.channelAutoSwitch.carriers = channel.carriers.map(carrierId => this.getCarrierNameByCarrierId(carrierId)).join(",");
    }
    this.channelAutoSwitch.providerName = channel.providerName;
    this.channelAutoSwitch.supportProvincesStr = channel.supportProvincesStr.replace(/、/g, ",");
  }

  // ===============备用通道配置============================================================
  backupChannelChange(channelId, item: AbstractControl) {
    let channel = this.getChannelById(channelId);
    item.get("channelNum")?.setValue(channel.channelNum);
    item.get("providerName")?.setValue(channel.providerName);
    item.get("extendNumLength")?.setValue(channel.extendNumLength);
    let carrierName = this.getCarrierNameByCarrierId(channel.carrierId);
    item.get("carrierName")?.setValue(carrierName);
    if (channel.carriers) {
      let carriers = channel.carriers.map(carrierId => this.getCarrierNameByCarrierId(carrierId)).join(",");
      item.get("carriers")?.setValue(carriers);
    }
    item.get("supportProvincesStr")?.setValue(channel.supportProvincesStr.replace(/、/g, ","));
  }

  // 整理备用渠道下拉列表
  arrangeBackupChannels() {
    const temp: any[] = [];
    for (let item of this.allBackupChannels) {
      if (!this.channelContains(item.id)) {
        temp.push(item);
      }
    }
    this.backupChannels = temp;
  }

  channelContains(id: any): boolean {
    let flag = false;
    const values = this.items.value;
    for (let item of values) {
      if (item.channelId === id) {
        flag = true;
      }
    }
    return flag;
  }

  createChannel(): UntypedFormGroup {
    return this.fb.group({
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

  addItem() {
    if (!this.channelAutoSwitch.channelId || this.channelAutoSwitch.channelId === "") {
      this.dialogService.notification.warning(this.subject, "请先选择主渠道！");
      return;
    }
    if (this.items.length > 4) {
      this.dialogService.notification.warning(this.subject, "备用渠道最多可添加5个");
      return;
    }
    this.backChannelAddFlag = true;
    let backupChannel = this.createChannel();
    this.setItemDisabled(backupChannel);
    this.items.push(backupChannel);
    this.arrangeBackupChannels();
    if (this.editIndex !== -1 && this.editObj) {
      this.items.at(this.editIndex).patchValue(this.editObj);
    }
    this.editObj = { ...this.items.at(this.items.length - 1).value };
    this.editIndex = this.items.length - 1;
    this.backChannelAddFlag = true;
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

  delItem(index: number) {
    // 判断当前是否备用渠道，且备用渠道是否正在使用（切换到备用渠道）
    let channelId = this.items.at(index).get("channelId")?.value;
    if (+this.currentChannelId === channelId) {
      this.dialogService.notification.warning("备用渠道删除", "系统已切换到该渠道，不允许删除！");
      return;
    }
    this.cleanBackupChannelEmptyItem();
    this.items.removeAt(index);
    this.editIndex = -1;
    this.arrangeBackupChannels();
    this.backChannelAddFlag = false;
  }

  editItem(index: number, isPageTrigger: boolean) {
    if (isPageTrigger) {
      this.arrangeBackupChannels();
      // 判断当前是否备用渠道，且备用渠道是否正在使用（切换到备用渠道）
      let channelId = this.items.at(index).get("channelId")?.value;
      if (+this.currentChannelId === channelId) {
        this.dialogService.notification.warning("备用渠道编辑", "系统已切换到该渠道，不允许编辑！");
        return;
      }
    }
    // 判断是否存在没填写的字段，有就不允许编辑其他行
    if (this.checkItemEmpty()) {
      this.dialogService.notification.warning("备用渠道编辑", "请先保存再编辑其他行！");
      return;
    }
    if (this.editIndex !== -1 && this.editObj) {
      this.items.at(this.editIndex).patchValue(this.editObj);
    }
    this.editObj = { ...this.items.at(index).value };
    this.editIndex = index;
    this.backChannelAddFlag = false;
  }

  // 6、在进行备用渠道的保存时，需要校验备用渠道的扩展码长度，是否大于等于主渠道的扩展码的长度。
  // 否则会由于可支持扩展码长度不一致，导致消息无法正常上行到对应账号。在保存时，仅进行告警即可。
  // 若用户强行保存，在进行上行时，找不到对应的账号，上行至默认账号即可。
  // 提示：备用渠道扩展码长度少于主渠道。会导致信息不可正常上行至对应账号，是否确认添加？
  saveItem(index: number) {
    let channelId = this.items.at(index).get("channelId")?.value;
    if (!channelId || channelId === "") {
      this.dialogService.notification.warning(this.subject, "请选择渠道");
      return;
    }
    if (this.channelAutoSwitch.extendNumLength > this.items.at(index).get("extendNumLength")?.value) {
      const options = {
        confirm: () => this.saveItem2(index, true), // 确定绑定方法
        cancel: () => this.close(), // 取消绑定方法
      };
      this.dialogService.modal.confirm("请确认是否添加", "备用渠道扩展码长度少于主渠道。会导致信息不可正常上行至对应账号，是否确认添加？", options);
    } else {
      this.saveItem2(index, true);
    }
    this.backChannelAddFlag = false;
  }

  saveItem2(index: number, isPageTrigger: boolean) {
    if (isPageTrigger) {
      this.arrangeBackupChannels();
    }
    this.items.at(index).markAsDirty();
    if (this.items.at(index).invalid) return;
    this.editIndex = -1;
    if (!this.backChannelAddFlag) {
      this.backChannelAddFlag = true;
    }
  }

  cancelItem(index: number) {
    this.arrangeBackupChannels();
    if (!this.items.at(index).value.key) {
      if (this.backChannelAddFlag) {
        this.delItem(index);
      } else {
        this.items.at(index).patchValue(this.editObj);
      }
    } else {
      this.items.at(index).patchValue(this.editObj);
    }
    this.editIndex = -1;
    this.backChannelAddFlag = false;
  }

  checkItemEmpty(): boolean {
    let flag = false;
    if (this.editIndex !== -1) {
      return true;
    }
    for (let item of this.items.value) {
      if (!item.channelId) {
        return true;
      }
    }
    return flag;
  }

  cleanBackupChannelEmptyItem() {
    let items = this.items.value;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].channelId) {
        this.items.removeAt(i);
      }
    }
  }

  // ==================渠道自动切换配置==================================================================
  createErrorItem(): UntypedFormGroup {
    return this.fb.group({
      errorCode: new UntypedFormControl("", [Validators.required]),
      errorCount: new UntypedFormControl("", [Validators.required, Validators.min(1), Validators.max(1000), Validators.pattern("^[0-9]*$")]),
      durationMinutes: new UntypedFormControl("", [Validators.required, Validators.min(1), Validators.max(60), Validators.pattern("^[0-9]*$")]),
    });
  }

  get errorItems() {
    return this.configForm.controls.errorItems as UntypedFormArray;
  }

  addErrorItem() {
    this.errorCodeAddFlag = true;
    this.errorItems.push(this.createErrorItem());
    if (this.editErrorItemIndex !== -1 && this.editErrorObject) {
      this.errorItems.at(this.editErrorItemIndex).patchValue(this.editErrorObject);
    }
    this.editErrorObject = {
      ...this.errorItems.at(this.errorItems.length - 1).value,
    };
    this.editErrorItemIndex = this.errorItems.length - 1;
    this.errorCodeAddFlag = true;
  }

  delErrorItem(index: number) {
    this.errorItems.removeAt(index);
    this.editErrorItemIndex = -1;
    this.errorCodeAddFlag = false;
    this.cleanErrorCodeEmptyItem();
  }

  editErrorItem(index: number) {
    if (this.editErrorItemIndex !== -1 && this.editErrorObject) {
      this.errorItems.at(this.editErrorItemIndex).patchValue(this.editErrorObject);
    }
    // 判断是否存在没保存的数据
    if (this.checkErrorCodeEmpty()) {
      this.dialogService.notification.warning(this.subject, "识别错误码自动切换填写不正确，请检查！");
      return;
    }
    this.editErrorObject = { ...this.errorItems.at(index).value };
    this.editErrorItemIndex = index;
    this.errorCodeAddFlag = false;
  }

  saveErrorItem(index: number) {
    this.errorItems.at(index).markAsDirty();
    if (this.errorItems.at(index).invalid) {
      this.dialogService.notification.warning(this.subject, "识别错误码自动切换填写不正确，请检查！");
      return;
    }
    this.editErrorItemIndex = -1;
    if (!this.errorCodeAddFlag) {
      this.errorCodeAddFlag = true;
    }
  }

  cancelErrorItem(index: number) {
    if (!this.errorItems.at(index).value.key) {
      if (this.errorCodeAddFlag) {
        this.delErrorItem(index);
      } else {
        this.errorItems.at(index).patchValue(this.editErrorObject);
      }
    } else {
      this.errorItems.at(index).patchValue(this.editErrorObject);
    }
    this.editErrorItemIndex = -1;
    this.errorCodeAddFlag = false;
  }

  checkErrorCodeEmpty(): boolean {
    let flag = false;
    for (let item of this.errorItems.value) {
      if (!item.errorCode || !item.errorCount || !item.durationMinutes) {
        return true;
      }
    }
    return flag;
  }

  cleanErrorCodeEmptyItem() {
    let items = this.errorItems.value;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].errorCode || !items[i].errorCount || !items[i].durationMinutes) {
        this.errorItems.removeAt(i);
      }
    }
  }

  // 保存
  save() {
    if (!this.checkConfigForm()) {
      return;
    }
    // 移除不必要的信息,和清空集合，防止重复点击添加
    this.channelAutoSwitch.carriers = null;
    this.channelAutoSwitch.backupChannels = [];
    // 切换配置
    let config = this.configForm.value;
    this.channelAutoSwitch.disconnectEnabled = config.disconnectEnabled;
    this.channelAutoSwitch.disconnectMinutes = config.disconnectMinutes === null || config.disconnectMinutes === "" ? "0" : config.disconnectMinutes;
    this.channelAutoSwitch.recoveryMinutes = config.recoveryMinutes === null || config.recoveryMinutes === "" ? "0" : config.recoveryMinutes;
    this.channelAutoSwitch.packSuccessRateEnabled = config.packSuccessRateEnabled;
    this.channelAutoSwitch.packWithinMinutes = config.packWithinMinutes === null || config.packWithinMinutes === "" ? "0" : config.packWithinMinutes;
    this.channelAutoSwitch.packFailCountReached =
      config.packFailCountReached === null || config.packFailCountReached === "" ? "0" : config.packFailCountReached;
    this.channelAutoSwitch.packFailRateUnder = config.packFailRateUnder === null || config.packFailRateUnder === "" ? "0" : config.packFailRateUnder;
    this.channelAutoSwitch.errorCodeEnabled = config.errorCodeEnabled;
    this.channelAutoSwitch.channelErrorCodes = this.errorItems.value;
    // 冗余多一个字段用来后台校验errorCode字段
    if (this.channelAutoSwitch.channelErrorCodes && this.channelAutoSwitch.channelErrorCodes.length > 0) {
      for (let errorCode of this.channelAutoSwitch.channelErrorCodes) {
        errorCode.errorCodeEnabled = this.channelAutoSwitch.errorCodeEnabled;
      }
    }
    // 备用渠道
    if (this.form.getRawValue().items.length > 0) {
      let index = 1;
      for (let item of this.form.getRawValue().items) {
        let temp: any = {
          channelId: item.channelId,
          parentChannelId: this.channelAutoSwitch.channelId,
          priority: index,
          useStatus: null,
        };
        if (this.channelId === 0) {
          // 新增时默认不使用默认渠道
          temp.useStatus = false;
        }
        this.channelAutoSwitch.backupChannels.push(temp);
        index++;
      }
    } else {
      // 没有备用渠道
      this.dialogService.notification.warning(this.subject, "请选择备用渠道！");
      return;
    }
    let url = URLS.channelAutoSwitchAdd.url;
    if (this.channelId > 0) {
      url = URLS.channelAutoSwitchEdit.url;
    }
    this.http.post(url, this.channelAutoSwitch).subscribe(res => {
      if (res.status === 0) {
        this.dialogService.notification.success(this.subject, `${this.operation}成功`);
        setTimeout(() => this.back(), 600);
      } else {
        this.dialogService.notification.error(this.subject, `${this.operation}失败`);
      }
    });
  }

  // 检查
  checkConfigForm(): boolean {
    // 备用渠道
    if (this.items.length === 0) {
      this.dialogService.notification.warning(this.subject, "请选择备用渠道！");
      return false;
    }
    //  运营商断连自动切换
    let disconnectEnabled = this.configForm.get("disconnectEnabled")?.value;
    if (disconnectEnabled === true) {
      let disconnectMinutes = this.configForm.get("disconnectMinutes")?.value;
      let recoveryMinutes = this.configForm.get("recoveryMinutes")?.value;
      if (!disconnectMinutes || disconnectMinutes === "") {
        this.dialogService.notification.warning("运营商断连自动切换", "断连时长不能为空，请检查！");
        return false;
      }
      if (!recoveryMinutes || recoveryMinutes === "") {
        this.dialogService.notification.warning("运营商断连自动切换", "恢复时长不能为空，请检查！");
        return false;
      }
    }
    // 识别批次成功率切换
    let packSuccessRateEnabled = this.configForm.get("packSuccessRateEnabled")?.value;
    if (packSuccessRateEnabled === true) {
      let packWithinMinutes = this.configForm.get("packWithinMinutes")?.value;
      let packFailRateUnder = this.configForm.get("packFailRateUnder")?.value;
      let packFailCountReached = this.configForm.get("packFailCountReached")?.value;
      if (!packWithinMinutes || packWithinMinutes === "") {
        this.dialogService.notification.warning("识别批次成功率切换", "时长不能为空，请检查！");
        return false;
      }
      if (packFailRateUnder === undefined || packFailRateUnder === "") {
        this.dialogService.notification.warning("识别批次成功率切换", "成功率不能为空，请检查！");
        return false;
      } else {
        // 校验范围
        if (packFailRateUnder < 0 || packFailRateUnder > 98) {
          this.dialogService.notification.warning("识别批次成功率切换", "成功率的填写范围为0~98，支持填写一位小数点");
          return false;
        }
      }
      if (!packFailCountReached || packFailCountReached === "") {
        this.dialogService.notification.warning("识别批次成功率切换", "失败条数不能为空，请检查！");
        return false;
      }
    }
    // 识别错误码自动切换
    let errorCodeEnabled = this.configForm.get("errorCodeEnabled")?.value;
    if (errorCodeEnabled === true) {
      // 校验错误码是否填写
      if (this.errorItems.length === 0) {
        this.dialogService.notification.warning("识别错误码自动切换", "错误码列表不能为空，请检查！");
        return false;
      }
    }
    return true;
  }

  // 运营商断连自动切换开关
  disconnectEnabledChange() {
    let disconnectEnabled = this.configForm.get("disconnectEnabled")?.value;
    if (disconnectEnabled === false) {
      this.configForm.get("disconnectMinutes")?.setValue("5");
      this.configForm.get("recoveryMinutes")?.setValue("5");
    }
  }

  // 识别批次成功率切换开关
  packSuccessRateEnabledChange() {
    let packSuccessRateEnabled = this.configForm.get("packSuccessRateEnabled")?.value;
    if (packSuccessRateEnabled === false) {
      this.configForm.get("packWithinMinutes")?.reset();
      this.configForm.get("packFailRateUnder")?.reset();
      this.configForm.get("packFailCountReached")?.reset();
    }
  }

  // 识别错误码自动切换开关
  errorCodeEnabledChange() {
    let errorCodeEnabled = this.configForm.get("errorCodeEnabled")?.value;
    if (errorCodeEnabled === false) {
      this.errorItems.clear();
    }
  }

  // 通道选择
  selectMainChannel(event) {
    if (event && (!this.mainChannels || this.mainChannels.length === 0)) {
      // 暂无符合条件数据
      const options = {
        confirm: () => {}, // 确定绑定方法
        cancel: () => {}, // 取消绑定方法
      };
      this.dialogService.message.error("暂无符合条件数据", options);
    }
  }

  // 通道选择
  selectBackupChannel(event, item) {
    if (item && item.get("channelId").value && item.get("channelId").value > 0) {
      let channelId = item.get("channelId").value;
      if (!this.backupChannelsContains(channelId)) {
        this.backupChannels.push(this.getChannelById(channelId));
      }
    }
    if (event && (!this.backupChannels || this.backupChannels.length === 0)) {
      // 暂无符合条件数据
      const options = {
        confirm: () => {}, // 确定绑定方法
        cancel: () => {}, // 取消绑定方法
      };
      this.dialogService.message.error("暂无符合条件数据", options);
    }
  }

  backupChannelsContains(id: any): boolean {
    let flag = false;
    const values = this.backupChannels;
    for (let item of values) {
      if (item.id === id) {
        flag = true;
      }
    }
    return flag;
  }

  back() {
    this.router.navigateByUrl(`/icc-standard/information/sms/channelChange/channelAutoSwitch`);
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

  close() {}

  showChannelName(item) {
    let cname;
    for (let i = 0, len = this.allBackupChannels.length; i < len; i++) {
      if (this.allBackupChannels[i].id === item.controls.channelId.value) {
        cname = this.allBackupChannels[i].name;
        break;
      }
    }
    return cname;
  }
}
