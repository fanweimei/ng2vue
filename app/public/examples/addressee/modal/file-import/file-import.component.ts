import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { URLS } from "@shared/constant/interface";
import { DialogService, IccUploadComponent } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { NzUploadFile, UploadFilter, NzUploadXHRArgs } from "ng-zorro-antd/upload";
import { Observable, Observer } from "rxjs";
import { tap, timeout } from "rxjs/operators";
import { Addressee } from "src/app/routes/message/Addressee";

@Component({
  selector: "app-file-import",
  templateUrl: "./file-import.component.html",
  styleUrls: ["./file-import.component.less"],
})
export class FileImportComponent {
  constructor(private http: _HttpClient, private dialogService: DialogService, private modal: NzModalRef) {}

  // 下载静态文件
  templateFile = URLS.attachment.url + "?attach=3&path=sendImport.zip";

  // 导入发送
  importURL = URLS.customerImport.url;

  uploadPercent: number;

  hasException: string;

  hasProgress = false;

  // 上传附件验证不通过的提示
  errorMsg: string;

  totalSize = 0;

  succSize = 0;

  // 分隔符标识
  delimiter: any;

  // 下载导入反馈文件
  stzaPath: string;

  okImport = false;

  // 发送文件导入组件
  @ViewChild("iccupload", { static: false }) iccUpload: IccUploadComponent;

  showReason = false;

  hasFailed = false;

  // 定期更新上传进度
  uploadProgressTimer: any = null;

  // 记录当前导入的收信人
  importAddee: Addressee;

  loading = false;

  account = 0;

  iconImg2 = "./assets/images/btnIcon/excel.png";

  filters: UploadFilter[] = [
    {
      name: "filter",
      fn: (fileList: NzUploadFile[]) => {
        let errorTip = "";
        let result = fileList;
        let suff = result[0].name.substring(result[0].name.lastIndexOf("."));
        const _fileUpload: any = this.iccUpload;
        const selectedSuff = _fileUpload.getSelectedFileSuff();
        if (!result[0].type) {
          if (suff === selectedSuff) {
            return result;
          } else {
            this.showReason = true;
            errorTip = "文件格式不正确，只支持 " + selectedSuff + " 格式";
            this.errorMsg = errorTip;
            return [];
          }
        }
        let filterFiles;
        if (selectedSuff !== "txt") {
          filterFiles = fileList.filter(
            w => ~["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].indexOf(w.type || ""),
          );
        } else {
          filterFiles = fileList.filter(w => ~["text/plain"].indexOf(w.type || ""));
        }
        if (filterFiles.length !== fileList.length) {
          this.showReason = true;
          errorTip = "文件格式不正确，只支持 " + selectedSuff + " 格式";
          result = filterFiles;
        }
        if (filterFiles[0] && filterFiles[0].size > 104857600) {
          this.showReason = true;
          errorTip = "文件超过限制大小";
          result = [];
        }
        this.errorMsg = errorTip;
        return result;
      },
    },
    {
      name: "async",
      fn: (fileList: NzUploadFile[]) => {
        return new Observable((observer: Observer<NzUploadFile[]>) => {
          // doing
          observer.next(fileList);
          observer.complete();
        });
      },
    },
  ];

  sendFileImportCustomReq = (item: NzUploadXHRArgs) => {
    this.hasFailed = false;
    this.hasException = "active";
    this.uploadPercent = 0;
    // 构建一个 FormData 对象，用于存储文件或其他参数
    const formData = new FormData();
    // tslint:disable-next-line:no-any
    formData.append("file", item.file as any);

    const fileUpload: any = this.iccUpload;
    const separatorIndex = fileUpload.getSeparatorIndex();
    if (-1 !== separatorIndex) {
      formData.append("delimiter", separatorIndex);
    }
    let reqLimit = 1000;
    this.uploadProgressTimer = setInterval(() => {
      reqLimit--;
      if (reqLimit > 0 && !this.hasFailed) {
        this.getUploadProgressPercent();
      }
    }, 500);
    this.hasProgress = true;
    // 始终返回一个 `Subscription` 对象，nz-upload 会在适当时机自动取消订阅 'application/x-www-form-urlencoded; charset=utf-8'
    return this.http
      .post(item.action!, formData, {
        "Content-Type": "application/json;charset=utf-8",
      })
      .pipe(timeout(1200000))
      .subscribe(
        event => {
          try {
            if (event) {
              this.stzaPath = "";
              if (event.status === 0) {
                this.totalSize = event.data.totalCount;
                this.succSize = event.data.sucCount;
                // 需求变更：导入收信人信息添加分隔符标识
                this.delimiter = event.data.delimiter;
                if (this.totalSize === 0) {
                  this.dialogService.notification.error("提示", "导入的数据为空");
                }
                if (this.totalSize === this.succSize) {
                  this.importAddee = new Addressee();
                  this.importAddee.name = "导入";
                  this.importAddee.len = this.succSize;
                  this.importAddee.contacts = [];
                  this.importAddee.contacts.push("f" + event.data.path + "$" + "导入" + "$" + this.succSize + "$" + this.delimiter);
                  this.importAddee.id = new Date().getTime();
                  this.importAddee.icon = this.iconImg2;
                  this.okImport = true;
                  this.hasException = "";
                  item.onSuccess!(event, item.file!, event);
                } else {
                  item.onError!(event.errorMsg, item.file!);
                  this.okImport = false;
                }
              } else if (event.status === -2) {
                this.stzaPath = URLS.attachment.url + "?module=1&path=" + event.data.failedFileName;
                this.totalSize = event.data.totalCount;
                this.succSize = event.data.sucCount;
                this.okImport = false;
                item.onError!(event.errorMsg, item.file!);
              } else {
                this.errorMsg = event.errorMsg;
                this.okImport = false;
                item.onError!(event.errorMsg, item.file!);
              }
            }
          } catch (e) {
            console.log(e);
          } finally {
            this.cancelTimer(this.uploadProgressTimer);
            if (event.status === 0 && this.totalSize === this.succSize) {
              this.uploadPercent = 100;
              this.hasException = "";
            } else {
              this.hasException = "exception";
            }
            this.hasProgress = false;
          }
        },
        err => {
          this.cancelTimer(this.uploadProgressTimer);
          item.onError!(err, item.file!);
          this.hasException = "exception";
          this.hasProgress = false;
        },
      );
  };

  cancelTimer(timer: any) {
    if (timer) {
      clearInterval(timer);
    }
  }

  getUploadProgressPercent() {
    this.http
      .get(URLS.uploadPercent.url)
      .pipe(tap(() => (this.loading = false)))
      .subscribe(res => {
        if (res) {
          if (+res.status === 0) {
            if (res.data !== "100") {
              this.uploadPercent = res.data;
            }
          } else {
            this.hasFailed = true;
          }
        }
      });
  }

  handleSendImportChange(info: any): void {
    const fileList = info.fileList;
    // 2. read from response and show file link
    if (info.file.response) {
      info.file.url = info.file.response.url;
    }
  }

  removeImport(evt) {
    this.okImport = false;
    this.iccUpload.reset();
  }

  handleCancel() {
    this.modal.destroy();
  }

  handleImport(): void {
    if (this.importAddee && this.importAddee.len > 0) this.modal.close(this.importAddee);
  }
}
