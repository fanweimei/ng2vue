import { Component, OnInit, OnDestroy, ViewChild, Input } from "@angular/core";
import {
  NzUploadFile,
  NzUploadXHRArgs,
  UploadFilter,
} from "ng-zorro-antd/upload";
import { URLS } from "@shared";
import { _HttpClient } from "@delon/theme";
import { Observable, Observer } from "rxjs";
import { DialogService, IccUploadComponent } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { NzProgressStatusType } from "ng-zorro-antd/progress";

@Component({
  selector: "app-import-export",
  templateUrl: "./import-export.component.html",
  styleUrls: ["./import-export.component.less"],
})
export class BlackListImportExportComponent implements OnInit, OnDestroy {
  // uploading = false;
  // fileList: UploadFile[] = [];
  // fileName: any;
  // // totalSize: any = 0;
  // // succSize: any = 0;
  // allFail: boolean;
  // isShowMessage: boolean;
  // isSingleFile = true;
  // stzaPath = URLS.attachment.url + '?attachment=4&bizType=2&fileName=';
  // examplePath = URLS.attachment.url + '?attachment=3&fileName=customerImportExample.xls';
  // subject = '导入客户';
  // // 上传进度条
  // isUploading = false;
  // // 上传百分比
  // // uploadPercent: number;
  // // 是否有exception
  // hasException: string;
  // // 导入是否失败
  // hasFailed = false;
  // uploadMessage = "文件正在上传,如数据量较大上传时间相对延长,请耐心等待!";
  // end
  @Input() cfgs: any;
  @Input() channelId: string;
  @Output() onChange = new EventEmitter();
  @ViewChild(LibraryEditbaseComponent) baseComp: LibraryEditbaseComponent;
  constructor(
    private http: _HttpClient,
    private modal: NzModalRef,
    private dialogService: DialogService
  ) {}
  @ViewChild("iccupload", { static: false }) iccUpload: IccUploadComponent;
  // 示例模板路径
  exampleUrl: string = "";
  // 上传路径
  actionUrl: string = "";
  uploadPercentUrl: string = "";
  // 上传附件验证不通过的提示
  errorMsg: string;
  // 过滤器
  filters: UploadFilter[] = [
    {
      name: "filter",
      fn: (fileList: NzUploadFile[]) => {
        let errorTip = "";
        let result = fileList;
        let suff = result[0].name.substring(result[0].name.lastIndexOf("."));
        if (!result[0].type) {
          if (suff === ".xlsx" || suff === ".xls") {
            return result;
          } else {
            this.showReason = true;
            errorTip = "文件格式不正确，只支持 xls,xlsx 格式";
            this.errorMsg = errorTip;
            return [];
          }
        }
        const filterFiles = fileList.filter(
          (w) =>
            ~[
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ].indexOf(w.type || "")
        );
        if (filterFiles.length !== fileList.length) {
          this.showReason = true;
          errorTip = "文件格式不正确，只支持 xls,xlsx 格式";
          result = filterFiles;
        }
        if (filterFiles[0] && filterFiles[0].size! > 104857600) {
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
          observer.next(fileList);
          observer.complete();
        });
      },
    },
  ];
  // 上传进度
  uploadPercent: number;
  // 进度条状态（枚举）'success' | 'exception' | 'active' | 'normal'
  uploadStatus: NzProgressStatusType;
  // 显隐进度条
  hasProgress: boolean;
  // 导入总条目数
  totalSize: number;
  // 符合规范的条目数
  succSize: number;
  // 失败原因
  stzaPath: string;
  // 定时器:更新上传进度
  uploadProgressTimer: any = null;
  // 上传请求
  tempItem: any;
  // 上传中
  uploading = false;

  // 针对此种假上传行为，初步的文件上传并不调用后台，之后的确定，才调用上传接口，这是只有报错才显示原因，成功则根据情况显示（如该页情况，成功后关闭，则无需显示了）
  showReason = false;

  handleUpload(): void {
    if (this.tempItem) {
      this.uploading = true;
      this.fileUpload(this.tempItem);
    }
  }

  // 异步处理
  customRequest = (item: NzUploadXHRArgs): any => {
    this.hasProgress = true;
    setTimeout(() => {
      this.uploadPercent = 100;
      this.uploadStatus = "success";
      this.hasProgress = false;
      this.showReason = false;
      item.onSuccess!(item, item.file!, item);
      this.tempItem = item;
    }, 3000);
  };

  /*异步上传*/
  fileUpload(item): void {
    const formData = new FormData();
    formData.append("file", item.file as any);
    // if(this.channelId) {
    //   formData.append('channelId', this.channelId);
    // }
    let reqLimit = 200;
    this.cancelTimer(); //219
    let aa = this.getValue();
    this.onChange.emit(true);
    this.uploadProgressTimer = setInterval(() => {
      // 223
      reqLimit--;
      if (reqLimit > 0 && this.hasProgress) {
        this.getUploadProgressPercent(() => {
          reqLimit = 0;
        });
      } else {
        this.cancelTimer();
      }
    }, 300);
    // this.hasProgress = true;
    let url = this.actionUrl; // 257
    if (this.channelId) {
      // 242
      url = `${this.actionUrl}?channelId=${this.channelId}`; // 236
    }
    this.http.post(url, formData).subscribe(
      // 208
      (res) => {
        // this.hasProgress = false;
        if (res.data) {
          this.totalSize = res.data.totalCount;
          this.succSize = res.data.sucCount;
        }
        if (res.status === 0) {
          // 此处请添加后续逻辑
          this.uploadPercent = 100;
          this.uploadStatus = "success";
          item.onSuccess!(res, item.file!, res);
          this.modal.close(true); // 208
        } else {
          this.errorMsg = res.errorMsg;
          this.uploadStatus = "exception";
          item.onError!(res.errorMsg, item.file!);
          this.showReason = true;
        }
        this.uploading = false;
        this.cancelTimer();
      },
      (error) => {
        this.uploading = false;
        this.errorMsg = "未知错误,请联系管理员!";
        this.uploadStatus = "exception";
        this.cancelTimer();
        item.onError!(error.errorMsg, item.file!);
        this.showReason = true;
      }
    );
  }
  // 获取上传进度
  getUploadProgressPercent(cb) {
    this.http.post(this.uploadPercentUrl).subscribe((res) => {
      if (res) {
        if (res.status === 0 || res.status === "0" || res.data !== 100) {
          this.uploadPercent = res.data;
        } else if ("function" === typeof cb) {
          cb();
        }
      }
    });
  }
  // 删除成功上传的文件
  fileRemove(evt) {
    this.tempItem = null;
    // console.log(evt);
    // 业务逻辑
  }
  // 根据上传的文件数据，刷新相关数据
  loadFileData() {
    // 业务逻辑
    this.modal.close(true);
  }
  // 清除定时器
  cancelTimer() {
    if (this.uploadProgressTimer) {
      clearInterval(this.uploadProgressTimer);
      this.uploadProgressTimer = null;
    }
  }

  // handleUpload(): void {
  //   this.stzaPath = URLS.attachment.url + '?attachment=4&bizType=2&fileName=';
  //   const formData = new FormData();
  //   let reqLimit = 10000;
  //   this.isUploading = true;
  //   this.uploading = true;
  //   this.uploadPercent = 1;
  //   // tslint:disable-next-line:no-any
  //   if (this.isSingleFile) {
  //     this.fileList.forEach((file: any) => {
  //       formData.append('file', file);
  //     });
  //   } else {
  //     this.fileList.forEach((file: any) => {
  //       formData.append('files[]', file);
  //     });
  //   }
  //   this.uploadProgressTimer = setInterval(() => {
  //     reqLimit--;
  //     if (reqLimit > 0 && !this.hasFailed) {
  //       this.getUploadProgressPercent();
  //     }
  //   }, 500);
  //
  //   this.http.post(URLS.customerImport2.url, formData).subscribe(res => {
  //     this.uploadPercent = 100;
  //     if (res.data) {
  //       this.totalSize = res.data.totalCount;
  //       this.succSize = res.data.sucCount;
  //     }
  //     if (res.status === 0) {
  //       this.isShowMessage = false;
  //       this.uploading = false;
  //       this.fileList = [];
  //       if (this.succSize === 0) {
  //         const massage = '导入0条，模板格式不正确';
  //         this.dialogService.notification.warning(this.subject, massage);
  //       } else {
  //         const massage = this.succSize + '条数据上传成功';
  //         this.dialogService.notification.success(this.subject, massage);
  //         this.modal.close(true);
  //       }
  //     } else {
  //       // 内容不符合模板规范
  //       if (res.status === 1) {
  //         this.isShowMessage = true;
  //         this.allFail = false;
  //         this.dialogService.notification.warning(this.subject, "部分数据不符合规范，请重新进行导入");
  //       }
  //       // 单个文件大小超限制
  //       if (res.status === -1) {
  //         this.dialogService.notification.error(this.subject, `${res.errorMsg}`);
  //       }
  //       // 文件类型不正确
  //       if (res.status === -3) {
  //         this.isShowMessage = true;
  //         this.allFail = true;
  //       }
  //       // 文件头或内容为空
  //       if (res.status === -5) {
  //         this.isShowMessage = true;
  //         this.allFail = true;
  //       }
  //       this.stzaPath = this.stzaPath + res.data.failedFileName;
  //       this.uploading = false;
  //     }
  //     this.cancelTimer(this.uploadProgressTimer);
  //   }, (error) => {
  //     this.uploadMessage = '未知错误,请联系管理员!';
  //     this.dialogService.notification.error(this.subject, "未知错误,请联系管理员!");
  //     this.hasException = 'exception';
  //     this.cancelTimer(this.uploadProgressTimer);
  //   });
  // }
  //
  // getUploadProgressPercent() {
  //   // console.log('获取上传进度');
  //   this.http
  //     .post(URLS.uploadPercent2.url)
  //     .pipe(tap(() => (this.uploading = true)))
  //     .subscribe(res => {
  //       // console.log(res);
  //       if (res) {
  //         if (res.status === 0 || res.status === '0' || res.data !== 100) {
  //           this.uploadPercent = res.data;
  //         } else {
  //           this.hasFailed = true;
  //         }
  //       }
  //     });
  // }
  ngOnInit() {
    this.actionUrl = URLS[`${this.cfgs.key}BlacklistImport`].url;
    this.uploadPercentUrl = URLS[`${this.cfgs.key}BlacklistUploadPercent`].url;
    this.exampleUrl =
      URLS.attachment.url +
      `?attach=3&path=${this.cfgs.subject}黑名单导入模板.xls`;
  }
  ngOnDestroy() {
    this.cancelTimer();
  }
  close() {
    this.modal.destroy();
  }
}
