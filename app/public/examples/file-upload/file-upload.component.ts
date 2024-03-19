import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UploadFilter } from "ng-zorro-antd/upload";

@Component({
  selector: "file-upload",
  templateUrl: "./file-upload.component.html",
  styleUrls: ["./file-upload.component.less"],
})
/* 该组件以antd中的nz-upload为基础，其中的参数请详见 https://ng.ant.design/components/upload/zh */
export class FileUploadComponent implements OnInit {
  /*------------upload参数---------------*/
  // 接受上传的文件类型
  @Input() accept: string;
  // 必选参数, 上传的地址
  @Input() action: string;
  // 上传文件之前的钩子，参数为上传的文件，若返回 false 则停止上传。注意：IE9 不支持该方法；注意：务必使用 => 定义处理方法。
  @Input() beforeUpload: Function;
  // 通过覆盖默认的上传行为，可以自定义自己的上传实现；注意：务必使用 => 定义处理方法。
  @Input() customRequest: Function;
  // 是否禁用
  @Input() disabled = false;
  // 限制文件大小，单位：KB；0 表示不限
  @Input() size = 0;
  // 限制文件类型，例如：image/png,image/jpeg,image/gif,image/bmp
  @Input() fileType: string;
  // 自定义过滤器
  @Input() filter: UploadFilter[];
  // 上传请求时是否携带 cookie
  @Input() withCredentials = false;
  // 上传文件改变时触发
  @Output() handleChange: EventEmitter<any> = new EventEmitter<any>();
  /*--------------nz-progress参数-------------------*/
  // 百分比
  @Input() percent = 0;
  // 进度条状态（枚举）'success' | 'exception' | 'active' | 'normal'
  @Input() status: string;

  /*--------------自定义参数-------------------*/
  // 模板路径
  @Input() exampleUrl: string;
  // 是否显示进度条：请在上传请求开始时设置为true,在请求结束（成功或失败）之后设置为false
  @Input() hasProgress = false;
  // 删除导入的文件
  @Output() remove: EventEmitter<any> = new EventEmitter<any>();
  // 导入总条目数
  @Input() totalCount = 0;
  // 符合规范的条目数
  @Input() successCount = 0;
  // 上传失败原因
  @Input() logUrl: string;
  // 文件列表，双向绑定，该数组用于自定义列表显示，并不沿用nz-upload的封装
  fileList: Array<any> = [];
  // 所选文件名
  currentFileName = "";
  // 文件上传状态
  fileStatusObj = {
    "0": "uploading",
    "1": "done",
    "2": "error",
  };

  // 针对非常规的假上传行为，控制显示原因（情况：员工/客户通讯录的上传）
  @Input() showReason = true;

  // 验证失败
  @Input() errorMsg: string;
  constructor() {}

  fileTypeSelection = {
    fileType: 1,
    fileList: [
      {
        index: 1,
        name: "xls/xlsx",
        value: ".xls",
      },
      {
        index: 3,
        name: "txt",
        value: ".txt",
      },
    ],
  };

  separatorSelection = {
    value: 4,
    list: [
      // {
      //   index: 2,
      //   name: '空格',
      //   value: ' ',
      // },
      // {
      //   index: 3,
      //   name: 'tab',
      //   value: '\t',
      // },
      {
        index: 4,
        name: "|",
        value: "|",
      },
      {
        index: 1,
        name: "逗号(英文)",
        value: ",",
      },
    ],
  };

  hasDeleteIcon = false;

  ngOnInit() {}

  getSelectedFileSuff() {
    let suff;
    this.fileTypeSelection.fileList.forEach(item => {
      if (this.fileTypeSelection.fileType === item.index) {
        suff = item.name;
      }
    });
    return suff;
  }

  getSeparatorIndex() {
    let index;
    if (this.fileTypeSelection.fileType === 3) {
      index = this.separatorSelection.value;
    } else {
      index = -1;
    }
    return index;
  }

  changeFileType(evt: any) {
    this.removeFile(0, undefined);
  }

  /*选中文件触发该事件*/
  change(evt) {
    this.removeFile(0, "change");
    this.percent = 0;
    if (evt && (evt.type === "success" || evt.type === "error")) {
      this.hasDeleteIcon = true;
    } else {
      this.hasDeleteIcon = false;
    }
    this.status = "normal";
    this.fileList = [evt.file];
    this.currentFileName = evt.file.name;
    this.handleChange.emit(evt);
  }
  /*删除上传的文件触发该事件*/
  removeFile(index, type?) {
    const file: any = this.fileList.splice(index, 1)[0];
    this.currentFileName = "";
    if (!type || (type && type !== "change")) {
      this.remove.emit(file);
    }
  }
  reset() {
    this.fileList = [];
    this.currentFileName = "";
    this.percent = 0;
    this.status = "normal";
    this.logUrl = "";
  }
}
