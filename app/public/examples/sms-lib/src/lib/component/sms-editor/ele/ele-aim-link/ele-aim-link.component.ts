import { Component, Input } from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";
import { ModalHelper, _HttpClient } from "@delon/theme";
import { BaseControlValueAccessor, DialogService, EventService } from "@icc/common-lib";
import { SmsAimLinkChooseComponent } from "../../../sms-aim-link-choose/sms-aim-link-choose.component";
import { EleItemBaseImpl, getControlProvider } from "@icc/share/msg-form";
import { URLS } from "../../../../shared/constant/interface";

@Component({
  selector: "ele-aim-link",
  templateUrl: "./ele-aim-link.component.html",
  providers: [getControlProvider(EleAimLinkComponent)],
})
export class EleAimLinkComponent extends BaseControlValueAccessor implements ControlValueAccessor, EleItemBaseImpl {
  @Input() aimLinkStatus: boolean;
  _jobId: string | null;
  @Input()
  set jobId(v: string | null) {
    this._jobId = v;
    if (this._jobId) {
      this.getAimLinkStatus();
    }
  }
  get jobId() {
    return this._jobId;
  }

  @Input() jobName: string | null;
  @Input() jobCode: string | null;
  @Input() tplId: string | null;
  @Input() linkType: string | null;
  // M 消息链接是否过期
  aimLinkExpire: boolean = false;

  value: string;

  writeValue(obj: any): void {
    this.value = obj;
  }

  constructor(private dialogService: DialogService, private modal: ModalHelper, private http: _HttpClient, private eventService: EventService) {
    super();
  }

  getAimLinkStatus() {
    this.http.get(URLS.getAimLinkListStatus.url + "?jobId=" + this.jobId).subscribe(res => {
      this.aimLinkExpire = res.status === 0 && res.data.linkStatus === 0;
      this.aimLinkStatus = this.aimLinkExpire;
    });
  }

  openAimLinkChoose() {
    if (!this.tplId) {
      this.dialogService.notification.warning("选择M消息链接", `请先选择M消息模板`);
      return;
    }
    this.modal.createStatic(SmsAimLinkChooseComponent, { templateId: this.tplId }, { size: "lg" }).subscribe(result => {
      this.value = result.linkType === 1 ? result?.aimUrl || "{M消息群发链接}" : "{M消息个性链接}";
      this.jobId = result?.jobId;
      this.jobCode = result?.jobCode;
      this.jobName = result?.jobName;
      this.linkType = result.linkType;
      this.onChange(this.value);
    });
  }

  validate() {
    if (this.aimLinkExpire) {
      this.eventService.change("invalid-material", "M消息选择的M消息链接已过期，终端解析可能失败，是否继续？");
      return false;
    }
    if (!this.value) {
      this.dialogService.notification.warning("提示", "请选择M消息链接");
      return false;
    }
    return true;
  }

  reset() {
    this.aimLinkExpire = false;
    this.jobId = null;
    this.jobCode = null;
    this.linkType = null;
    this.value = "";
  }

  getValue() {
    return {
      aimLinkInfo: {
        jobCode: this.jobCode,
      },
    };
  }

  setValue(params) {}

  onTemplateChange(id: string) {
    this.tplId = id;
  }
}
