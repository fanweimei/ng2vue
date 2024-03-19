import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { NzUploadFile, NzUploadXHRArgs, UploadFilter } from "ng-zorro-antd/upload";
import { NzModalRef } from "ng-zorro-antd/modal";
import { _HttpClient } from "@delon/theme";
import { Observable, Observer } from "rxjs";
import { DialogService, IccUploadComponent } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";
import { NzProgressStatusType } from "ng-zorro-antd/progress";

@Component({
  selector: "app-sms-sendconstraint-import-export",
  templateUrl: "./import-export.component.html",
  styleUrls: ["./import-export.component.less"],
})
export class SmsKeywordImportExportComponent implements OnInit, OnDestroy {
  static NAME = "sendconstraint-file-import-export";
  // uploading = false;
  // fileList: UploadFile[] = [];
  // fileName: any;
  // // totalSize: any = 0;
  // // succSize: any = 0;
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
  constructor(private http: _HttpClient, private modal: NzModalRef, private dialogService: DialogService) {}
  @ViewChild("iccupload", { static: false }) iccUpload: IccUploadComponent;
  // 示例模板路径
  exampleUrl: string = URLS.attachment.url + "?attach=3&path=短信敏感字导入模板.xls";
  // 上传路径
  actionUrl: string = URLS.keywordImport.url + "/0";
  uploadPercentUrl: string = URLS.keywordUploadPercent.url;
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
          w => ~["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].indexOf(w.type || ""),
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
    let reqLimit = 200;
    this.cancelTimer();
    this.uploadProgressTimer = setInterval(() => {
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
    // const params = {
    //   formData: formData,
    //   msgTypes: 0, // 短信类型
    // };
    this.http.post(this.actionUrl, formData).subscribe(
      res => {
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
          this.modal.close(true);
        } else {
          this.errorMsg = res.errorMsg;
          this.uploadStatus = "exception";
          item.onError!(res.errorMsg, item.file!);
          this.showReason = true;
        }
        this.uploading = false;
        this.cancelTimer();
      },
      error => {
        this.uploading = false;
        this.errorMsg = "未知错误,请联系管理员!";
        this.uploadStatus = "exception";
        this.cancelTimer();
        item.onError!(error.errorMsg, item.file!);
        this.showReason = true;
      },
    );
  }
  // 获取上传进度
  getUploadProgressPercent(cb) {
    const params = { msgTypes: 0 }; // 短信类型
    this.http.post(this.uploadPercentUrl, params).subscribe(res => {
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

  ngOnInit() {}
  ngOnDestroy() {
    this.cancelTimer();
  }
  close() {
    this.modal.destroy();
  }
}
