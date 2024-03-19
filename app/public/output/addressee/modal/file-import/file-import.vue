<template>
<section><div class="modal-header-update">
  <div class="modal-title">导入</div>
</div>

<div class="main">
  <file-upload ref="iccupload" :example-url="templateFile" :action="importURL" :filter="filters" :size="104857600" :custom-request="sendFileImportCustomReq" :percent="uploadPercent" :status="hasException" :has-progress="hasProgress" :error-msg="errorMsg" :total-count="totalSize" :success-count="succSize" :log-url="stzaPath" @handleChange="handleSendImportChange" @remove="removeImport"></file-upload>
</div>

<div class="modal-footer modal-footer-update">
  <icc-button :btn-type="'hollow'" @btnClick="handleCancel">
    <span>取消</span>
  </icc-button>
  <icc-button :btn-type="'default'" :is-disabled="!okImport" @btnClick="handleImport">
    <span>确定</span>
  </icc-button>
</div>
</section>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { Addressee } from "src/app/routes/message/Addressee";
import { tap, timeout } from "rxjs/operators";
import { IccUploadComponent } from "@icc/components";
import { URLS } from "@/api/interface";
import { from, Observable, Observer } from "rxjs";
import { useNotification } from "@icc/hooks";
import { http } from "@icc/api";

const dialogService = useNotification();

defineOptions({
	name: 'AppFileImport',
});

const emits = defineEmits(["close"]);
let showReason: boolean = false;
let hasFailed: boolean = false;
let uploadProgressTimer: any = null;
let loading: boolean = false;
let delimiter: any;
let importAddee: Addressee;
let iconImg2: string = "./assets/images/btnIcon/excel.png";
const templateFile = ref(URLS.attachment.url + "?attach=3&path=sendImport.zip");
const importURL = ref(URLS.customerImport.url);
const errorMsg = ref<string>();
const filters = ref<any[]>([
    {
      name: "filter",
      fn: (fileList: any[]) => {
        let errorTip = "";
        let result = fileList;
        let suff = result[0].name.substring(result[0].name.lastIndexOf("."));
        const _fileUpload: any = iccUpload.value;
        const selectedSuff = _fileUpload.getSelectedFileSuff();
        if (!result[0].type) {
          if (suff === selectedSuff) {
            return result;
          } else {
            showReason = true;
            errorTip = "文件格式不正确，只支持 " + selectedSuff + " 格式";
            errorMsg.value = errorTip;
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
          showReason = true;
          errorTip = "文件格式不正确，只支持 " + selectedSuff + " 格式";
          result = filterFiles;
        }
        if (filterFiles[0] && filterFiles[0].size > 104857600) {
          showReason = true;
          errorTip = "文件超过限制大小";
          result = [];
        }
        errorMsg.value = errorTip;
        return result;
      },
    },
    {
      name: "async",
      fn: (fileList: any[]) => {
        return new Observable((observer: Observer<any[]>) => {
          // doing
          observer.next(fileList);
          observer.complete();
        });
      },
    },
  ]);
const hasException = ref<string>();
const uploadPercent = ref<number>();
const hasProgress = ref<boolean>(false);
const stzaPath = ref<string>();
const totalSize = ref<number>(0);
const succSize = ref<number>(0);
const okImport = ref<boolean>(false);
const iccUpload = ref<IccUploadComponent>();

function getUploadProgressPercent() {
    from(http
      .get(URLS.uploadPercent.url))
      .pipe(tap(() => (loading = false)))
      .subscribe(res => {
        if (res) {
          if (+res.status === 0) {
            if (res.data !== "100") {
              uploadPercent.value = res.data;
            }
          } else {
            hasFailed = true;
          }
        }
      });
  }

function cancelTimer(timer: any) {
    if (timer) {
      clearInterval(timer);
    }
  }

const sendFileImportCustomReq = (item: any) => {
    hasFailed = false;
    hasException.value = "active";
    uploadPercent.value = 0;
    // 构建一个 FormData 对象，用于存储文件或其他参数
    const formData = new FormData();
    // tslint:disable-next-line:no-any
    formData.append("file", item.file as any);

    const fileUpload: any = iccUpload.value;
    const separatorIndex = fileUpload.getSeparatorIndex();
    if (-1 !== separatorIndex) {
      formData.append("delimiter", separatorIndex);
    }
    let reqLimit = 1000;
    uploadProgressTimer = setInterval(() => {
      reqLimit--;
      if (reqLimit > 0 && !hasFailed) {
        getUploadProgressPercent();
      }
    }, 500);
    hasProgress.value = true;
    // 始终返回一个 `Subscription` 对象，nz-upload 会在适当时机自动取消订阅 'application/x-www-form-urlencoded; charset=utf-8'
    return from(http
      .post(item.action!, formData, {
        "Content-Type": "application/json;charset=utf-8",
      }))
      .pipe(timeout(1200000))
      .subscribe(
        event => {
          try {
            if (event) {
              stzaPath.value = "";
              if (event.status === 0) {
                totalSize.value = event.data.totalCount;
                succSize.value = event.data.sucCount;
                // 需求变更：导入收信人信息添加分隔符标识
                delimiter = event.data.delimiter;
                if (totalSize.value === 0) {
                  dialogService.error("提示", "导入的数据为空");
                }
                if (totalSize.value === succSize.value) {
                  importAddee = new Addressee();
                  importAddee.name = "导入";
                  importAddee.len = succSize.value;
                  importAddee.contacts = [];
                  importAddee.contacts.push("f" + event.data.path + "$" + "导入" + "$" + succSize.value + "$" + delimiter);
                  importAddee.id = new Date().getTime();
                  importAddee.icon = iconImg2;
                  okImport.value = true;
                  hasException.value = "";
                  item.onSuccess!(event, item.file!, event);
                } else {
                  item.onError!(event.errorMsg, item.file!);
                  okImport.value = false;
                }
              } else if (event.status === -2) {
                stzaPath.value = URLS.attachment.url + "?module=1&path=" + event.data.failedFileName;
                totalSize.value = event.data.totalCount;
                succSize.value = event.data.sucCount;
                okImport.value = false;
                item.onError!(event.errorMsg, item.file!);
              } else {
                errorMsg.value = event.errorMsg;
                okImport.value = false;
                item.onError!(event.errorMsg, item.file!);
              }
            }
          } catch (e) {
            console.log(e);
          } finally {
            cancelTimer(uploadProgressTimer);
            if (event.status === 0 && totalSize.value === succSize.value) {
              uploadPercent.value = 100;
              hasException.value = "";
            } else {
              hasException.value = "exception";
            }
            hasProgress.value = false;
          }
        },
        err => {
          cancelTimer(uploadProgressTimer);
          item.onError!(err, item.file!);
          hasException.value = "exception";
          hasProgress.value = false;
        },
      );
  }

function handleSendImportChange(info: any) {
    const fileList = info.fileList;
    // 2. read from response and show file link
    if (info.file.response) {
      info.file.url = info.file.response.url;
    }
  }

function removeImport(evt) {
    okImport.value = false;
    iccUpload.value?.reset();
  }

function handleCancel() {
    emits('close');
  }

function handleImport() {
    if (importAddee && importAddee.len > 0) emits('close', importAddee);
  }
</script>
