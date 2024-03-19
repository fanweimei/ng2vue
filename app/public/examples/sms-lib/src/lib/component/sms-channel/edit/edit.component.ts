import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { URLS } from "../../../shared/constant/interface";
import { _HttpClient } from "@delon/theme";
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators, AbstractControl, ValidationErrors } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { DialogService, MessageService } from "@icc/common-lib";
import { SEComponent } from "@delon/abc/se";
import { NzMessageService } from "ng-zorro-antd/message";
import { RouteHandlers } from "../../../../../../common-lib/src/lib/services/route-handlers.service";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"],
})
export class SmsChannelEditComponent implements OnDestroy {
  @ViewChild("extendNumSe") extendNumSe: SEComponent;
  static NAME = "icc-msg-channel-edit";
  constructor(
    private msgSrv: NzMessageService,
    public http: _HttpClient,
    private fb: UntypedFormBuilder,
    private router: Router,
    private dialogService: DialogService,
    public activedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private routeHandlers: RouteHandlers,
  ) {}
  name: "";
  optionList: any[] = [];
  recordId: number;
  ParentRegionList: any[] = [];
  regionList: any[] = [];
  normalSms: boolean;
  longSms: boolean;
  id: number;
  paramKey: any;
  checkDisable = false;
  nameHid = true;
  identityHid = true;
  bizTypeBindHid = true;
  isSubmit = false;
  extendNumLengthDisable = false;
  // 通道签名是否禁用
  signatureDisable = false;

  reg = new RegExp(/^((?!\[|\]|\【|\】).)*$/);

  carrierList: any[] = [
    { label: "移动", id: 1 },
    { label: "联通", id: 2 },
    { label: "电信", id: 3 },
  ];
  paramKeyList: any[] = [
    { label: "计费用户类型", id: "userfeetype" },
    { label: "被计费用户的号码", id: "billingnumber" },
    { label: "资费类型", id: "feetype" },
    { label: "资费代码", id: "feecode" },
  ];
  paramKeyListMap: any = {};
  paramKeyIndex: any[] = ["userfeetype", "billingnumber", "feetype", "feecode"];
  form: UntypedFormGroup = this.fb.group({
    id: new UntypedFormControl(null), // 渠道商id
    providerId: new UntypedFormControl(null, [Validators.required]), // 渠道商id
    name: new UntypedFormControl(null, [Validators.maxLength(30), Validators.required, Validators.pattern("^[^ ]+$")]), // 渠道名
    appSecret: new UntypedFormControl(null, [Validators.maxLength(20), Validators.required, Validators.pattern(/^[\s\S]*.*[^\s][\s\S]*$/)]), // 渠道密码
    appKey: new UntypedFormControl(null, [Validators.maxLength(20), Validators.required, Validators.pattern(/^[\s\S]*.*[^\s][\s\S]*$/)]), // 渠道账号
    port: new UntypedFormControl(null, [Validators.max(65535), Validators.required, Validators.pattern("^[0-9]*$")]), // ip端口
    identity: new UntypedFormControl(null, [Validators.maxLength(50), Validators.required, Validators.pattern("^[a-zA-Z][a-zA-Z0-9]*$")]), // 渠道标识号
    hostname: new UntypedFormControl(null, [
      Validators.required,
      Validators.pattern(
        "^(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|[1-9])\\." +
          "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)\\." +
          "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)\\." +
          "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)$|" +
          "^((https|http|ftp|rtsp|mms)?://)?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]",
      ),
    ]), // ip地址

    supportMo: new UntypedFormControl(null), // 是否支持上行
    supportStateReport: new UntypedFormControl(null), // 是否支持状态报告
    maxLength: new UntypedFormControl(null, [Validators.required, Validators.pattern("^[0-9]*$"), Validators.max(1000), Validators.min(1)]), // 单条短信的最大字节长度
    regionId: new UntypedFormControl(null, [Validators.required, Validators.min(35)]), // 市级地区id
    parentRegionId: new UntypedFormControl(null), // 省级地区id
    channelNum: new UntypedFormControl(null, [Validators.required, Validators.maxLength(20), Validators.pattern("^[0-9]*$")]), // 渠道号
    carriers: new UntypedFormControl(null, [Validators.required]), // 可发送运营商
    paramValue: new UntypedFormControl(null, [Validators.maxLength(100), Validators.pattern("^[0-9a-zA-Z]*$")]), // 参数配置,参数值
    state: new UntypedFormControl(null), // 通道状态
    speed: new UntypedFormControl(null, [Validators.required, Validators.pattern("^[0-9]*$"), Validators.max(5000)]), // 发送速度
    moWaitTime: new UntypedFormControl(null, [Validators.pattern("^[0-9]*$")]), // 上行分段等待处理时间上限
    extendLength: new UntypedFormControl(null, [Validators.required, Validators.pattern("^[0-9]*$"), Validators.max(10), Validators.min(0)]), // 消息切分时所需要的字节空间
    carrierId: new UntypedFormControl(null, [Validators.required]), // 所属地区运营商
    protocolVersion: new UntypedFormControl(null, [Validators.required, Validators.min(0)]), // 协议版本号
    msgTypes: new UntypedFormControl(null, [Validators.required]), // checkbox
    // corpID: new FormControl(null, [Validators.pattern('^[0-9]*$')]), // 企业ID
    corpID: new UntypedFormControl(null, [Validators.pattern("^[0-9a-zA-Z]*$")]), // 企业ID
    serviceID: new UntypedFormControl(null, [Validators.pattern("^[0-9a-zA-Z]*$")]), // 业务代码
    supportAllProvinces: new UntypedFormControl(null), // 可发送省份 - 全国
    supportProvincesList: new UntypedFormControl(null), // 可发送省份 - 多选省份
    hidControl: new UntypedFormControl(null, [Validators.required]), // 隐藏控制
    hidNameControl: new UntypedFormControl(null, [Validators.required]), // 隐藏控制
    hidBizControl: new UntypedFormControl(null, [Validators.required]), // 隐藏控制
    extend: new UntypedFormControl("true", [Validators.required]), // 是否拓展
    extendNumLength: new UntypedFormControl(null, [Validators.pattern("^[0-9]+$")]), // 拓展长度
    supportSignature: new UntypedFormControl("true", [Validators.required]), // 是否支持通道签名
    signature: new UntypedFormControl(null, [Validators.required, Validators.maxLength(16), this.validateSignature]), // 通道签名
  });
  extendNumLengthMsg = "限制输入2位数字";
  defaultModel: 0;
  channelList: any[] = [];
  parameters: any[] = [];
  tempCarriers: any[] = [];
  tempProvinces: any;
  subject = "短信渠道";
  record: any = {};
  carrierFlag = true;
  /* 可发送省份 - 全国 */
  supportAllProvinces: boolean = true;
  /* 可发送省份校验 */
  isSupportProvinces: boolean = false;
  ngOnInit(): void {
    this.normalSms = true;
    this.longSms = true;
    const urlSel = URLS.searchChannelProvider.url;
    this.id = +this.activedRoute.snapshot.params.id;
    this.paramKey = "userfeetype";
    this.form.get("hidControl")?.setValue(1);
    this.form.get("hidNameControl")?.setValue(1);
    this.form.get("hidBizControl")?.setValue(1);
    this.form.get("state")?.setValue(1);
    this.form.get("moWaitTime")?.setValue(1);
    this.form.get("supportMo")?.setValue("true");
    this.form.get("supportStateReport")?.setValue("true");
    this.form.get("state")?.setValue(1);
    this.form.get("maxLength")?.setValue(140);
    this.form.get("extendLength")?.setValue(6);
    if (this.normalSms) {
      this.form.get("msgTypes")?.setValue(1);
    }
    if (this.longSms) {
      this.form.get("msgTypes")?.setValue(2);
    }

    for (let item of this.paramKeyList) {
      this.paramKeyListMap[item.id] = item.label;
    }

    // 参数0是短信
    this.http.post(urlSel, 0).subscribe(res => {
      this.channelList = res.data;
    });
    this.http.post(URLS.smsChannelRegion.url).subscribe(res => {
      this.ParentRegionList = res.data;
      if (this.id > 0) {
        this.http.post(URLS.oneSmsChannel.url + this.id).subscribe(param => {
          const params = param.data;

          if (params.id > 0) {
            this.form.get("id")?.setValue(params.id);
            this.form.get("providerId")?.setValue(+params.providerId);
            // this.form.get('name')?.setValue(params.name);
            this.form.get("name")?.reset({ value: params.name, disabled: true });
            this.name = params.name;
            // this.form.get('identity')?.setValue(params.identity);
            this.form.get("identity")?.reset({ value: params.identity, disabled: true });
            this.form.get("appSecret")?.setValue(params.appSecret);
            this.form.get("hostname")?.setValue(params.hostname);
            this.form.get("appKey")?.setValue(params.appKey);
            this.form.get("port")?.setValue(params.port + "");
            this.form.get("parentRegionId")?.setValue(+params.parentRegionId);
            this.form.get("regionId")?.setValue(+params.regionId);
            this.form.get("channelNum")?.setValue(params.channelNum);
            this.form.get("supportMo")?.setValue(params.supportMo + "");
            this.form.get("supportStateReport")?.setValue(params.supportStateReport + "");
            this.form.get("maxLength")?.setValue(params.maxLength);
            this.form.get("extendLength")?.setValue(params.extendLength);
            this.tempCarriers = params.carriers;
            this.form.get("protocolVersion")?.setValue(params.protocolVersion + "");
            this.form.get("state")?.setValue(+params.state);
            this.form.get("carrierId")?.setValue(params.carrierId + "");
            this.form.get("carriers")?.setValue(params.carriers);
            this.form.get("speed")?.setValue(params.speed);
            this.form.get("moWaitTime")?.setValue(params.moWaitTime);
            this.form.get("corpID")?.setValue(params.corpID);
            this.form.get("serviceID")?.setValue(params.serviceID);
            this.form.get("supportAllProvinces")?.setValue(params.supportAllProvinces);
            this.form.get("supportProvincesList")?.setValue(params.supportProvincesList);
            this.tempProvinces = {
              all: params.supportAllProvinces,
              list: params.supportProvincesList,
            };

            this.checkDisable = true;
            if (params.longSms === true) {
              this.normalSms = true;
              this.longSms = true;
            } else {
              this.normalSms = true;
              this.longSms = false;
            }
            if (params.parametersList != null) {
              params.parametersList.forEach(element => {
                this.parameters.push(element);
              });
            }
            if (this.normalSms) {
              this.form.get("msgTypes")?.setValue(1);
            }
            this.form.get("extend")?.setValue(params.extend + "");
            this.form.get("extendNumLength")?.setValue(params.extendNumLength);
            this.form.get("supportSignature")?.setValue(params.supportSignature + "");
            this.form.get("signature")?.setValue(params.signature);
            this.form.get("extendNumLength")?.setValidators([Validators.max(20 - this.form.get("channelNum")?.value.length), Validators.pattern("^[0-9]*$")]);
            this.extendNumLengthMsg =
              "可扩展长度最大可输入的数字为" +
              (20 - this.form.get("channelNum")?.value.length) +
              "（" +
              (20 - this.form.get("channelNum")?.value.length) +
              "的计算为20-渠道号位数。）";
          }
        });
      }
    });
  }

  validateSignature(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    if (!control.value.trim()) {
      return { empty: true };
    }
    const reg = ["[", "]", "【", "】"];
    return control.value && reg.find(e => control.value.includes(e)) ? { hasSpecial: true } : null;
  }

  ngOnDestroy() {
    if (this.record.id) {
      sessionStorage.removeItem(`sms_${this.record.id}`);
    }
  }
  ngChannelNumChange(value) {
    this.form.get("extendNumLength")?.setValidators([Validators.pattern("^[0-9]*$"), Validators.max(20 - this.form.get("channelNum")?.value.length)]);
    this.extendNumLengthMsg =
      "可扩展长度最大可输入的数字为" +
      (20 - this.form.get("channelNum")?.value.length) +
      "（" +
      (20 - this.form.get("channelNum")?.value.length) +
      "的计算为20-渠道号位数。）";
    this.form.controls.extendNumLength.markAsDirty();
    this.form.controls.extendNumLength.updateValueAndValidity();
  }
  ngModelChange(value) {
    const control = this.form.get("extendNumLength") as UntypedFormControl;
    if (value === "false") {
      this.extendNumLengthDisable = true;
      control.reset({ value: "", disabled: true });
    } else {
      this.extendNumLengthDisable = false;
      control.reset({ value: "", disabled: false });
    }
    this.cdr.detectChanges();
    // abc框架库有问题...
    setTimeout(() => {
      this.extendNumSe.invalid = false;
    }, 10);
  }
  supportSignatureChange(value) {
    if (value === "false") {
      this.signatureDisable = true;
      this.form.get("signature")?.reset({ value: "", disabled: true });
    } else {
      this.signatureDisable = false;
      this.form.get("signature")?.reset({ value: "", disabled: false });
    }
    // this.cdr.detectChanges();
  }

  longSmsChange() {
    if (this.longSms) {
      this.normalSms = true;
    }
  }
  normalSmsChange() {
    if (!this.normalSms) {
      this.longSms = false;
    }
  }
  paramAdd() {
    let paramValue = this.form.get("paramValue")?.value;
    if (!paramValue || !paramValue.trim()) {
      this.dialogService.notification.error(this.subject, "内容为空，请重新输入");
      return;
    }
    paramValue = paramValue.trim();
    let flag = true;
    if (!this.form.get("paramValue")?.valid) {
      this.dialogService.notification.error(this.subject, "限制只允许输入数字和字母组合!");
      flag = false;
    }
    if (paramValue != null && paramValue !== "") {
      this.parameters.forEach(param => {
        const parkey = param.split(":")[0];
        if (parkey === this.paramKey) {
          this.dialogService.notification.error(this.subject, "参数 [" + this.paramKeyListMap[this.paramKey] + "] 已经添加，请添加另外的参数!");
          flag = false;
        }
      });
      if (flag) {
        this.parameters.push(this.paramKey + ":" + paramValue);
        const index = this.paramKeyIndex.indexOf(this.paramKey);
        const nextSelIndex = index === this.paramKeyIndex.length - 1 ? 0 : index + 1;
        this.paramKey = this.paramKeyIndex[nextSelIndex];
      }
    } else {
      this.dialogService.notification.error(this.subject, "请输入正确的参数!");
    }
  }

  getParameterName(item) {
    const arr = item.split(":");
    if (arr.length < 2) {
      return item;
    }
    let zhName = this.paramKeyListMap[arr[0]];
    if (!zhName) {
      return item;
    }
    return `${zhName}: ${arr[1]}`;
  }
  paramDel(index: number) {
    this.parameters.splice(index, 1);
  }
  paramDelAll() {
    this.parameters = [];
  }

  getFormParams() {
    let param: any = {};
    for (let key in this.form.controls) {
      param[key] = this.form.controls[key].value;
    }
    return param;
  }

  // 检验渠道运营商在短信自动切换中是否合法
  invalidCarriersAutoSwitch(id, carriers) {
    return new Promise<boolean>((resolve, reject) => {
      this.http
        .post(URLS.channelAutoSwitchCheckCarriersAutoSwitch.url, {
          id,
          carriers,
        })
        .subscribe(res => {
          if (res.status === 0) {
            resolve(false);
          } else {
            this.dialogService.notification.error(this.subject, res.errorMsg);
            resolve(true);
          }
        });
    });
  }

  // 检验渠道可发送省份在短信自动切换中是否合法
  invalidProvincesAutoSwitch(id, supportAllProvinces, supportProvincesList) {
    return new Promise<boolean>((resolve, reject) => {
      this.http
        .post(URLS.channelAutoSwitchCheckProvincesAutoSwitch.url, {
          id,
          supportAllProvinces,
          supportProvincesList,
        })
        .subscribe(res => {
          if (res.status === 0) {
            resolve(false);
          } else {
            this.dialogService.notification.error(this.subject, res.errorMsg);
            resolve(true);
          }
        });
    });
  }

  async save(e) {
    if (this.isSubmit) {
      return;
    }
    this.isSubmit = true;
    let value = this.getFormParams();
    const { id, carriers, supportAllProvinces, supportProvincesList } = value;
    value.longSms = this.longSms;
    value.parametersList = this.parameters;
    // 校验可发送省份表单项
    if (!value.supportAllProvinces && value.supportProvincesList.length === 0) {
      this.dialogService.notification.error(this.subject, "请选择可发送省份");
      return;
    }
    let url = URLS.addSmsChannelManagement.url;
    this.recordId = value.id;
    if (this.recordId > 0) {
      url = URLS.editSmsChannelManagement.url;
      // 编辑时点击保存进行如下校验
      let result =
        (await this.invalidCarriersAutoSwitch(id, carriers)) || (await this.invalidProvincesAutoSwitch(id, supportAllProvinces, supportProvincesList));
      if (result) {
        // 校验失败，标记isSubmit为false
        this.isSubmit = false;
        return;
      }
    }
    if ((value.extendNumLength == null || value.extendNumLength == "") && value.extend == "true") {
      value.extendNumLength = 20 - this.form.get("channelNum")?.value.length;
    }
    if (this.form.get("supportSignature")?.value == "false") {
      this.form.get("signature")?.setValue("");
    }

    if (value.signature) {
      value.signature = value.signature.replace(/[\[\]【】]/gi, "");
    }
    this.http.post(url, value).subscribe(
      res => {
        if (res.status === 0) {
          if (this.recordId > 0) {
            this.dialogService.notification.success(this.subject, "保存成功");
          } else {
            this.dialogService.notification.success(this.subject, "新增成功");
          }
          this.close();
          this.isSubmit = false;
        } else {
          this.isSubmit = false;
          this.dialogService.notification.error(this.subject, "保存失败:" + res.errorMsg);
        }
      },
      () => {
        this.isSubmit = false;
        this.dialogService.notification.error(this.subject, "保存失败: 网络出错！");
      },
    );
  }
  parentRegionChange(value: any) {
    // 值改变先清空数据
    this.form.get("regionId")?.setValue("-1");
    this.http.post(URLS.smsChannelRegion.url, value).subscribe(res => {
      this.regionList = res.data;
    });
  }
  close() {
    this.router.navigateByUrl("/icc-standard/information/channelManagement/sms");
  }

  checkedBoxChange(value: string[]): void {
    if (this.normalSms || this.longSms) {
      this.form.get("msgTypes")?.setValue("1");
    } else {
      this.form.get("msgTypes")?.setValue(null);
    }
  }

  ngNameChange() {
    // 防抖时间，单位毫秒
    this.record.id = this.form.get("id")?.value;
    this.record.name = this.form.get("name")?.value;
    this.http
      .post(URLS.checkChannelName.url, {
        ...this.record,
        msgType: this.messageService.getMsgTypeByName("sms"),
      })
      .subscribe(res => {
        if (res.status === -1) {
          this.nameHid = false;
          this.form.get("hidNameControl")?.setValue(null);
        } else {
          this.nameHid = true;
          this.form.get("hidNameControl")?.setValue(1);
        }
      });
  }
  ngIdentityChange() {
    // 防抖时间，单位毫秒

    this.record.id = this.form.get("id")?.value;
    this.record.identity = this.form.get("identity")?.value;
    this.http.post(URLS.checkChannelIdentity.url, this.record).subscribe(res => {
      if (res.status === -1) {
        this.identityHid = false;
        this.form.get("hidControl")?.setValue(null);
      } else {
        this.identityHid = true;
        this.form.get("hidControl")?.setValue(1);
      }
    });
  }

  // 渲染到carries的时候,就调用了这个ngModelChange方法,所以刚进来调用这个方法是没有渲染到carrier这个值的
  checkBizType(carries) {
    if (this.tempCarriers.every(e => carries.includes(e))) {
      return;
    }
    if (this.id > 0) {
      const formValue = this.form.value;
      this.http
        .post(URLS.checkChannelCarrierBizTypeBind.url, {
          id: formValue.id,
          carriers: formValue.carriers,
        })
        .subscribe(res => {
          if (res.status === -1) {
            // if (this.carrierFlag) {
            this.dialogService.notification.warning("短信渠道编辑", "【可发送运营商】需要解除与业务模板关系后，方可取消勾选。");
            // this.carrierFlag = false;
            this.form.get("carriers")?.setValue(this.tempCarriers);
            // } else {
            //   this.carrierFlag = true;
            // }
          } else {
            this.tempCarriers = this.form.get("carriers")?.value;
          }
        });
    }
  }

  // 全国checkbox改变时的回调函数
  supportProvinceChange(e) {
    if (e) {
      this.form.get("supportProvincesList")?.setValue([]);
    } else {
      this.isSupportProvinces = this.form.get("supportProvincesList")?.value.length === 0;
    }
    this.checkProvince(this.form.get("supportAllProvinces")?.value, this.form.get("supportProvincesList")?.value, true);
  }

  // 可发送省份select改变时的回调函数
  provinceChange(e) {
    this.isSupportProvinces = !this.form.get("supportAllProvinces")?.value && e?.length === 0;
    this.checkProvince(this.form.get("supportAllProvinces")?.value, this.form.get("supportProvincesList")?.value, false);
  }

  // 校验当前渠道是否存在关联的业务模板（修改可发送省份时）
  checkProvince(supportAllProvinces, supportProvincesList, isAll) {
    // 未修改时不需要执行校验
    if ((this.tempProvinces.list || []).every(item => supportProvincesList.includes(item)) && this.tempProvinces?.all === supportAllProvinces) return;
    if (this.id > 0) {
      const formValue = this.form.value;
      this.http
        .post(URLS.channelManagementCheckProvince.url, {
          id: formValue.id,
          supportAllProvinces,
          supportProvincesList,
        })
        .subscribe(res => {
          if (res.status === -1) {
            this.dialogService.notification.warning(`${this.subject}编辑`, "当前渠道已与业务模板/业务分类关联，需要解除关联关系，方可修改【可发送省份】");
            isAll
              ? this.form.get("supportAllProvinces")?.setValue(this.tempProvinces.all)
              : this.form.get("supportProvincesList")?.setValue(this.tempProvinces.list);
          } else {
            isAll
              ? (this.tempProvinces.all = this.form.get("supportAllProvinces")?.value)
              : (this.tempProvinces.list = this.form.get("supportProvincesList")?.value);
          }
        });
    }
  }
}
