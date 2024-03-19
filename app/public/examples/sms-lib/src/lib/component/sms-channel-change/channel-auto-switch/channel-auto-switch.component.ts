import { Component, OnInit, ViewChild } from "@angular/core";
import { _HttpClient, ModalHelper, ModalHelperOptions } from "@delon/theme";
import { STComponent, STColumn, STReq, STRequestOptions, STRes, STPage, STData, STChange, STColumnButton } from "@delon/abc/st";
import { Router } from "@angular/router";
import { ACLService } from "@delon/acl";
import { ChannelAutoSwitchViewComponent } from "./view/view.component";
// import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from "@angular/forms";
import { FormGroup, NgForm, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from "@angular/forms";
import { DialogService, throttle } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";
import { Observable, Observer } from "rxjs";
// import { throttle } from "plugins/common-lib/src/lib/utils/common";

@Component({
  selector: "app-channel-auto-change",
  templateUrl: "./channel-auto-switch.component.html",
  styleUrls: ["./channel-auto-switch.component.less"],
})
export class ChannelAutoSwitchComponent implements OnInit {
  static NAME = "icc-msg-channel-change-switch";
  constructor(
    private http: _HttpClient,
    private dialogService: DialogService,
    private router: Router,
    private aclService: ACLService,
    private modal: ModalHelper,
    private fb: UntypedFormBuilder,
  ) {}
  userNameAsyncValidator = (control: UntypedFormControl) =>
    new Observable((observer: Observer<ValidationErrors | null>) => {
      setTimeout(() => {
        const myreg = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;
        const phoneArr = control.value.split(";").filter(item => !!item);
        const flag = phoneArr.every(item => myreg.test(item));
        this.curCount = phoneArr.length;
        if (!flag) {
          // you have to return `{error: true}` to mark it as an error event
          observer.next({ error: true });
        } else {
          if (this.curCount > 1000) {
            observer.next({ error: true });
          } else {
            observer.next(null);
          }
        }
        observer.complete();
      }, 1000);
    });
  form: UntypedFormGroup = this.fb.group({
    noticePerson: ["", [Validators.required], [this.userNameAsyncValidator]],
  });
  url = URLS.channelAutoSwitch.url;
  subject = "自动切换配置";

  @ViewChild("st", { static: false }) st: STComponent;

  columns: STColumn[] = [
    {
      title: "",
      fixed: "left",
      index: "channelId",
      type: "checkbox",
    },
    {
      title: "渠道名称",
      fixed: "left",
      width: 152,
      index: "channelName",
      render: "channelNameTp",
      className: "text-center",
    },
    {
      title: "渠道号",
      width: 120,
      index: "channelNum",
      className: "text-center",
    },
    {
      title: "渠道商",
      width: 120,
      index: "providerName",
      className: "text-center",
    },
    {
      title: "所属运营商",
      width: 120,
      className: "text-center",
      index: "carrier",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.carrier) {
          return this.getCarrierNameByCarrierId(item.carrier);
        } else {
          return "未知";
        }
      },
    },
    {
      title: "支持运营商",
      width: 140,
      className: "text-center",
      index: "carriers",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.carriers && item.carriers.length > 0) {
          return item.carriers.map(carrierId => this.getCarrierNameByCarrierId(carrierId)).join(",");
        } else {
          return "未知";
        }
      },
    },
    {
      title: "可发送省份",
      width: 140,
      className: "text-center",
      render: "tpl-supportProvincesList",
    },
    {
      title: "备用渠道数",
      width: 110,
      className: "text-center",
      index: "backupChannels",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.backupChannels && item.backupChannels.length > 0) {
          return item.backupChannels.length + "";
        } else {
          return "0";
        }
      },
    },
    {
      title: "运营商断连切换",
      width: 140,
      className: "text-center",
      index: "disconnectEnabled",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.disconnectEnabled) {
          return "开启";
        } else {
          return "关闭";
        }
      },
    },
    {
      title: "识别批次成功率切换",
      width: 160,
      className: "text-center",
      index: "packSuccessRateEnabled",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.packSuccessRateEnabled) {
          return "开启";
        } else {
          return "关闭";
        }
      },
    },
    {
      title: "识别错误码切换",
      width: 140,
      className: "text-center",
      index: "errorCodeEnabled",
      format: (item: STData, col: STColumn, index: number) => {
        if (item.errorCodeEnabled) {
          return "开启";
        } else {
          return "关闭";
        }
      },
    },
    {
      title: "当前渠道",
      width: 240,
      className: "text-center",
      index: "channelName",
      format: (item: STData, col: STColumn, index: number) => {
        return this.getCurrentChannel(item);
      },
    },
    {
      title: "状态",
      width: 80,
      className: "text-center",
      type: "tag",
      index: "enableStatus",
      tag: {
        true: { text: "已启用", color: "green" },
        false: { text: "已停用", color: "red" },
      },
    },
    {
      title: "操作",
      width: 220,
      fixed: "right",
      className: "text-center",
      buttons: [
        {
          text: channelAutoSwitch => {
            if (channelAutoSwitch.useStatus === false) return "备切主";
            else {
              return "主切备";
            }
          },
          click: (item: any) => this.confirmManualSwitch(item),
          acl: { ability: ["channelAutoSwitch.manualSwitch"] },
          iif: (item: STData, btn: STColumnButton, column: STColumn) => item.enableStatus,
          iifBehavior: "disabled",
        },
        {
          text: channelAutoSwitch => {
            if (channelAutoSwitch.enableStatus === false) return "启用";
            else {
              return "停用";
            }
          },
          click: (item: any) => this.confirm(item),
          acl: { ability: ["channelAutoSwitch.active"] },
          iif: (item: STData, btn: STColumnButton, column: STColumn) => {
            return item.useStatus === true;
          },
          iifBehavior: "disabled",
        },
        {
          text: "编辑",
          click: (item: any) => this.edit(item),
          acl: { ability: ["channelAutoSwitch.edit"] },
        },
        {
          text: "更多",
          children: [
            {
              text: "删除",
              click: (item: any) => this.showModal(item, false),
              acl: { ability: ["channelAutoSwitch.delete"] },
            },
            {
              text: "通知",
              click: (item: any) => this.showNoticeModal(item),
              acl: { ability: ["channelAutoSwitch.saveNoticeTerminal"] },
            },
          ],
        },
      ],
    },
  ];
  pi = 1;
  ps = 10;
  total = 0;
  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      if (requestOptions.body.params.channelName === undefined) {
        requestOptions.body.params.channelName = "";
      }
      if (requestOptions.body.params.carrier === undefined) {
        requestOptions.body.params.carrier = "-1";
      }
      if (requestOptions.body.params.channelNum === undefined) {
        requestOptions.body.params.channelNum = "";
      }
      if (requestOptions.body.params.enableStatus === undefined) {
        requestOptions.body.params.enableStatus = "";
      }
      this.pi = requestOptions.body.pi;
      this.ps = requestOptions.body.ps;
      return requestOptions;
    },
  };
  res: STRes = {
    process: (data, rawData) => {
      this.total = rawData.total;
      data.forEach(item => {
        item.supportProvinces = item.supportProvinces.replace(/、/g, ",");
      });
      return data;
    },
  };
  page: STPage = {};
  noticeForm: any = {
    noticePerson: ''
  };
  validate: any;
  validateNotice: any;
  throttleFn: any;
  noticeValid: any;
  required: any;
  selectedRows: STData[] = [];
  channelId: any;
  isBatch: any;
  messages: any;
  // 切换原因
  isVisible: any = false;
  // 短信渠道切换通知设置
  isNoticeVisible: boolean = false;
  // 当前输入的号码
  curCount: number = 0;
  // 打开弹框时选中的数据
  selectChannel: any;

  manualSwitchReason: any;
  manualChannelAutoSwitch: any;

  options: ModalHelperOptions = {
    /** 大小；例如：lg、600，默认：`lg` */
    size: 900,
  };

  /*searchOptions*/
  searchOptions: any = {
    channelName: "",
    carrier: {
      select: -1,
      list: [
        { label: "全部", value: -1 },
        { label: "移动", value: 1 },
        { label: "联通", value: 2 },
        { label: "电信", value: 3 },
      ],
    },
    channelNum: "",
    enableStatus: {
      select: "",
      list: [
        { label: "全部", value: "" },
        { label: "启用", value: true },
        { label: "停用", value: false },
      ],
    },
  };
  expandForm = false;

  ngOnInit() {
    // 节流
    this.throttleFn = throttle(this.checkNoticeValid, 100);
    setTimeout(() => {
      this.resetTableList();
    }, 0);
  }

  getTableList() {
    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        channelName: this.searchOptions.channelName,
        carrier: this.searchOptions.carrier.select,
        channelNum: this.searchOptions.channelNum,
        enableStatus: this.searchOptions.enableStatus.select,
      },
    });
  }

  resetTableList() {
    // 重置搜索条件
    this.searchOptions.channelName = "";
    this.searchOptions.carrier.select = -1;
    this.searchOptions.channelNum = "";
    this.searchOptions.enableStatus.select = "";
    // 重新加载table数据
    this.getTableList();
  }

  /** 点击通知 */
  showNoticeModal(item): void {
    this.selectChannel = item;
    this.isNoticeVisible = true;
  }

  showModal(item, isBatch): void {
    if (this.selectedRows.length === 0 && isBatch) {
      this.dialogService.notification.warning(this.subject, "请先选择自动切换配置记录！");
      return;
    }
    // td4808 如果当前生效渠道为备用渠道，则不允许删除该配置。防止回切失败。
    if (item.backUpChannelActive) {
      this.dialogService.notification.warning(this.subject, "已切换至备用渠道的记录不可删除。");
      return;
    }
    if (!isBatch) {
      this.channelId = item.channelId;
    } else {
      for (let row of this.selectedRows) {
        if (row.backUpChannelActive) {
          this.dialogService.notification.warning(this.subject, "已切换至备用渠道的记录不可删除。");
          return;
        }
      }
    }
    this.isBatch = isBatch;
    this.messages = "是否确认删除所选数据?";
    const options = {
      confirm: () => {
        this.handleOk();
      }, // 确定绑定方法
      cancel: this.handleCancel, // 取消绑定方法
    };
    this.dialogService.modal.confirm("请确认是否删除!", this.messages, options);
  }

  handleOk(): void {
    if (this.isBatch) {
      this.delete();
    } else {
      this.deleteOne(this.channelId);
    }
  }

  handleCancel(): void {}

  stChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        break;
      case "pi":
        this.selectedRows = [];
        break;
      case "filter":
        this.resetTableList();
        break;
    }
  }

  add() {
    this.router.navigate(["/icc-standard/information/sms/channelChange/channelAutoSwitch/add"], {
      queryParams: {
        channelId: 0,
        isEdit: "1",
      },
    });
  }

  edit(channelAutoSwitch) {
    this.router.navigate(["/icc-standard/information/sms/channelChange/channelAutoSwitch/edit"], {
      queryParams: {
        channelId: channelAutoSwitch.channelId,
        isEdit: "1",
        currentChannelId: channelAutoSwitch.currentChannelId,
      },
    });
  }

  // 校验手机号
  checkNoticeValid() {
    this.validate = '';
    this.validateNotice = undefined;
    this.required = undefined;
    if (this.noticeForm.noticePerson && this.noticeForm.noticePerson.trim()) {
      const myreg = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;
      const phoneArr = this.noticeForm.noticePerson.split(",").filter(item => !!item);
      this.curCount = phoneArr.length;
      const flag = phoneArr.every(item => myreg.test(item));
      if (!flag) {
        this.validate = 'error';
        this.noticeValid = true;
      } else {
        this.validate = 'success';
        this.required = undefined;
        this.noticeValid = undefined;
      }
    } else {
      this.validate = "error";
      this.required = true;
    }
  }

  onblur() {
    this.checkNoticeValid();
  }

  /**
   * 短信渠道切换通知设置-打开
   */
  handleModalOpen(): void {
    this.http.get(URLS.channelAutoSwitchDetail.url + "/" + this.selectChannel.channelId).subscribe(res => {
      if (res.status === 0) {
        this.noticeForm.noticePerson = res?.data?.noticeTerminal || '';
        this.checkNoticeValid();
        this.curCount = this.noticeForm.noticePerson.split(',').filter(item => item)?.length || 0;
      } else {
        this.dialogService.notification.error(this.subject, `${res.errorMsg}`);
      }
    });
  }
  /**
   * 短信渠道切换通知设置-关闭
   */
  handleCancelNotice(f): void {
    this.isNoticeVisible = false;
    this.curCount = 0;
    // f.resetForm();
    this.noticeForm.noticePerson = '';
  }

  /**
   * 短信渠道切换通知设置-保存
   * @param f 表单对象
   */
  handleNoticeOk(f): void {
    if (f.valid) {
      this.http.post(URLS.channelAutoSwitchSaveNotice.url + this.selectChannel?.channelId, f.value.noticePerson).subscribe(res => {
        if (res.status === 0) {
          this.isNoticeVisible = false;
          this.dialogService.notification.success("提示", `保存成功！`);
        } else {
          this.dialogService.notification.error("提示", `${res.errorMsg}`);
        }
      });
    }
  }
  confirm(channelAutoSwitch) {
    // 当进行停用时，需中央弹窗提示【是否停用所选记录？】
    if (channelAutoSwitch.enableStatus === true) {
      // 是否停用所选记录？
      this.messages = "停用后渠道将不会自动切换，是否确定停用？";
      const options = {
        confirm: () => {
          this.active(channelAutoSwitch);
        }, // 确定绑定方法
        cancel: this.handleCancel, // 取消绑定方法
      };
      this.dialogService.modal.confirm("请确认是否停用!", this.messages, options);
    } else {
      this.active(channelAutoSwitch);
    }
  }

  confirmManualSwitch(channelAutoSwitch) {
    channelAutoSwitch.carriers = null;
    // 检查是否有存活的渠道能切换
    this.http.post(URLS.channelAutoSwitchCheckChannelAvailable.url, channelAutoSwitch).subscribe(res => {
      if (res.status === 0) {
        if (res.data) {
          // 是否切换渠道？
          /* this.messages = '是否切换渠道？';
          const options = {
            confirm: () => {
              this.manulSwitch(channelAutoSwitch);
            }, // 确定绑定方法
            cancel: this.handleCancel, // 取消绑定方法
          };
          this.dialogService.modal.confirm('请确认是否切换!', this.messages, options); */
          this.isVisible = true;
          this.manualChannelAutoSwitch = channelAutoSwitch;
        } else {
          this.dialogService.notification.warning("手动切换渠道", "暂时没有可用渠道切换！");
        }
      } else {
        this.dialogService.notification.error("手动切换渠道", "检测要切换的渠道状态失败");
      }
    });
  }

  manulSwitchOk(f: NgForm) {
    const manualSwitchReason = this.manualSwitchReason.trim();
    if (manualSwitchReason.length < 3) {
      this.dialogService.notification.warning("手动切换渠道", "请输入有效的3-20个字符！");
      return;
    }
    this.manualChannelAutoSwitch.manualSwitchReason = manualSwitchReason;
    this.manulSwitch(this.manualChannelAutoSwitch);
    this.isVisible = false;
    this.manualSwitchReason = "";
    f.reset();
  }

  get isSWitchValide() {
    return this.manualSwitchReason && this.manualSwitchReason.trim();
  }

  handleCancelSwitch(f: NgForm): void {
    this.isVisible = false;
    this.manualSwitchReason = "";
    f.reset();
  }

  manulSwitch(channelAutoSwitch) {
    channelAutoSwitch.carriers = null;
    this.http.post(URLS.channelAutoSwitchManualSwitch.url, channelAutoSwitch).subscribe(res => {
      if (res.status === 0) {
        if (res.data) {
          let message = "";
          if (channelAutoSwitch.useStatus) {
            // 主切备
            message = "已从" + "【" + channelAutoSwitch.channelName + "】渠道成功切换至" + "【" + res.data.channelName + "】渠道";
          } else {
            // 备切主
            for (let channel of channelAutoSwitch.backupChannels) {
              if (channel.useStatus) {
                message = "已从" + "【" + channel.channelName + "】渠道成功切换至" + "【" + res.data.channelName + "】渠道";
              }
            }
          }
          // this.dialogService.message.success(message);
          this.dialogService.notification.success("手动切换渠道", message);
          this.resetTableList();
        } else {
          this.dialogService.notification.error("手动切换渠道", "手动切换渠道失败");
        }
      } else {
        this.dialogService.notification.error("手动切换渠道", "手动切换渠道异常");
      }
    });
  }

  active(channelAutoSwitch) {
    channelAutoSwitch.carriers = null;
    let operation;
    // '0:停用，1:启用',
    if (channelAutoSwitch.enableStatus === true) {
      channelAutoSwitch.enableStatus = false;
      operation = "停用";
    } else {
      channelAutoSwitch.enableStatus = true;
      operation = "启用";
    }
    this.http.post(URLS.channelAutoSwitchActive.url, channelAutoSwitch).subscribe(res => {
      if (res.status === 0) {
        this.getTableList();
        this.dialogService.notification.success(this.subject, `${operation}成功`);
      } else {
        this.dialogService.notification.success(this.subject, `${res.errorMsg}`);
      }
    });
  }

  detail(channelAutoSwitch) {
    const haveAcl = this.aclService.canAbility("channelAutoSwitch.detail");
    if (!haveAcl) {
      this.dialogService.notification.error(this.subject, "查询详情失败!您没有查询详情权限!");
    } else {
      this.modal
        .createStatic(
          ChannelAutoSwitchViewComponent,
          {
            record: channelAutoSwitch,
          },
          this.options,
        )
        .subscribe(() => this.resetTableList());
    }
  }

  deleteOne(channelId) {
    this.http.post(URLS.channelAutoSwitchDelete.url + "/" + channelId).subscribe(res => {
      if (res.status === 0) {
        const pages = Math.ceil((this.total - 1) / this.ps);
        const pi = this.pi > pages && pages != 0 ? pages : this.pi;
        this.st.load(pi);
        this.dialogService.notification.success(this.subject, "删除成功");
      } else {
        this.dialogService.notification.error(this.subject, "删除失败");
      }
    });
  }

  delete() {
    this.http
      .post(
        URLS.channelAutoSwitchDelete.url,
        this.selectedRows.map(i => i.channelId),
      )
      .subscribe(res => {
        if (res.status === 0) {
          const pages = Math.ceil((this.total - this.selectedRows.length) / this.ps);
          const pi = this.pi > pages && pages != 0 ? pages : this.pi;
          this.st.load(pi);
          this.st.clearCheck();
          this.dialogService.notification.success(this.subject, "删除成功");
        } else {
          this.dialogService.notification.error(this.subject, "删除失败");
        }
      });
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
  /**
   * 获取当前渠道
   */
  getCurrentChannel(item): string {
    if (item.useStatus) {
      item.backUpChannelActive = false;
      return "主【" + item.channelName + "】";
    }
    if (item.backupChannels === null || item.backupChannels === undefined) {
      return "";
    }
    for (let channel of item.backupChannels) {
      if (channel.useStatus) {
        item.backUpChannelActive = true;
        item.currentChannelId = channel.channelId;
        return "备【" + channel.channelName + "】";
      }
    }
    return "";
  }
}
