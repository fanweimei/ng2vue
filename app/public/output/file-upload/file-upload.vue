<template>
<div class="icc-upload">
  <a-alert type="warning" closeable="false" style="margin: 0 -25px 20px -25px">
    <template #message>
      <ng-content></ng-content>
      <span class="warning-text">文件不可以超过100M，为确保导入文件格式的正确性，请</span>
      <a :href="exampleUrl" target="_blank">下载导入模板</a>
    </template>
</a-alert>

  <div class="row-item">
    <label class="item-name">文件类型：</label>
    <a-radio-group v-model:value="fileTypeSelection.fileType" @change="changeFileType">
      <a-radio v-for="item in fileTypeSelection.fileList" :value="item.index" class="radio-item">
        {{ item.name }}
      </a-radio>
    </a-radio-group>
  </div>

  <div class="row-item" v-if="fileTypeSelection.fileType === 3">
    <label class="item-name">分隔符：</label>
    <a-radio-group v-model:value="separatorSelection.value">
      <a-radio v-for="item in separatorSelection.list" :value="item.index" class="radio-item">
        {{ item.name }}
      </a-radio>
    </a-radio-group>
  </div>

  <div class="upload-box">
    <a-input-group size="large">
      <a-input type="text" class="show-input" v-model:value="currentFileName" disabled>
<template #addOnAfter>
      <a-upload :accept="accept" :action="action" :before-upload="beforeUpload" :custom-request="customRequest" :disabled="disabled" :show-upload-list="false" :with-credentials="withCredentials" @change="change">
        选择文件
      </a-upload>
    </template>
</a-input>
    </a-input-group>
    <p class="limit-size">文件不能超过{{ (size / 1024 / 1024).toFixed(0) }}M</p>
    <ul v-if="fileList.length" class="file-list">
      <li v-for="(file, i ) in fileList" class="file-item">
        <label class="left">
          <loading-outlined v-if="fileStatusObj['0'] === file.status" />
          <file-excel-outlined v-if="fileStatusObj['1'] === file.status" />
          <file-excel-outlined v-if="fileStatusObj['2'] === file.status" style="color: red" />
          <span :style="{
              color: fileStatusObj['2'] === file.status ? 'red' : '#49536e'
            }">
            {{ file.name }}
          </span>
        </label>
        <img class="right" v-if="hasDeleteIcon" @click="(e) => removeFile(i)" src="./assets/images/btnIcon/delete_red.png" alt="" />
      </li>
    </ul>
  </div>
  <div class="progress-box" v-if="hasProgress">
    <p>
      <span class="float-left">正在导入</span>
      <span class="float-right">{{ percent }}%</span>
    </p>
    <a-progress :show-info="false" :status="status" :percent="percent"></a-progress>
  </div>
  <div v-if="fileList.length && !hasProgress && showReason">
    <section>
      <div class="notification-wrapper total-box">
        <div class="title">
          <img v-if="fileStatusObj['1'] === fileList[0].status" src="./assets/images/layout/success.png" alt="" />
          <img v-if="fileStatusObj['2'] === fileList[0].status" src="./assets/images/layout/error.png" alt="" />
          <span v-if="fileStatusObj['1'] === fileList[0].status" class="tip-text">导入成功</span>
          <span v-if="fileStatusObj['2'] === fileList[0].status" class="tip-text">导入失败</span>
        </div>
        <div class="content">
          <span v-if="errorMsg">{{ errorMsg }}</span>
          <span v-if="!errorMsg && fileStatusObj['1'] === fileList[0].status && totalCount == successCount">
            共导入{{ totalCount }}条记录！全部数据项符合规范！
          </span>
          <span v-if="!errorMsg && fileStatusObj['1'] === fileList[0].status && totalCount != successCount">
            共导入{{ totalCount }}条记录！{{ successCount }}条记录符合规范！部分数据项不符合规范！修改后请重新导入！
          </span>
          <span v-if="!errorMsg && fileStatusObj['2'] === fileList[0].status">
            共导入{{ totalCount }}条记录！{{ successCount }}条记录符合规范！部分数据项不符合规范！修改后请重新导入！
          </span>
          <a v-if="!errorMsg && logUrl" :href="logUrl">下载查看原因</a>
        </div>
      </div>
    </section>
  </div>
  <div v-if="!fileList.length && !hasProgress && errorMsg">
    <section>
      <div class="notification-wrapper total-box">
        <div class="title">
          <img src="./assets/images/layout/error.png" alt="" />
          <span class="tip-text">导入失败</span>
        </div>
        <div class="content">
          <span v-if="errorMsg">{{ errorMsg }}</span>
        </div>
      </div>
    </section>
  </div>
</div>

</template>
<script lang="ts" setup>
import { computed, PropType, reactive, ref } from "vue";

defineOptions({
	name: 'FileUpload',
});

const props = defineProps({
	accept: {
	type: String,
	},
	action: {
	type: String,
	},
	beforeUpload: {
	type: Object as PropType<Function>,
	},
	customRequest: {
	type: Object as PropType<Function>,
	},
	disabled: {
	type: Boolean,
		default: false
	},
	size: {
	type: Number,
		default: 0
	},
	fileType: {
	type: String,
	},
	filter: {
	type: Object as PropType<any[]>,
	},
	withCredentials: {
	type: Boolean,
		default: false
	},
	percent: {
	type: Number,
		default: 0
	},
	status: {
	type: String,
	},
	exampleUrl: {
	type: String,
	},
	hasProgress: {
	type: Boolean,
		default: false
	},
	totalCount: {
	type: Number,
		default: 0
	},
	successCount: {
	type: Number,
		default: 0
	},
	logUrl: {
	type: String,
	},
	showReason: {
	type: Boolean,
		default: true
	},
	errorMsg: {
	type: String,
	},
});
const emits = defineEmits(["handleChange","update:percent","update:status","remove","update:logUrl"]);
const currentFileName = ref<string>("");
const fileList = ref<Array<any>>([]);
const hasDeleteIcon = ref<boolean>(false);
const fileTypeSelection = reactive({
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
  });
const separatorSelection = reactive({
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
  });
const fileStatusObj = reactive({
    "0": "uploading",
    "1": "done",
    "2": "error",
  });
const percent = computed({
	get() {
		return props.percent;
	},
	set(value) {
		emits('update:percent', value);
	}
});const status = computed({
	get() {
		return props.status;
	},
	set(value) {
		emits('update:status', value);
	}
});const logUrl = computed({
	get() {
		return props.logUrl;
	},
	set(value) {
		emits('update:logUrl', value);
	}
});

function ngOnInit() {}
ngOnInit();

function removeFile(index, type?) {
    const file: any = fileList.value.splice(index, 1)[0];
    currentFileName.value = "";
    if (!type || (type && type !== "change")) {
      emits('remove', file);
    }
  }

function changeFileType(evt: any) {
    removeFile(0, undefined);
  }

function change(evt) {
    removeFile(0, "change");
    percent.value = 0;
    if (evt && (evt.type === "success" || evt.type === "error")) {
      hasDeleteIcon.value = true;
    } else {
      hasDeleteIcon.value = false;
    }
    status.value = "normal";
    fileList.value = [evt.file];
    currentFileName.value = evt.file.name;
    emits('handleChange', evt);
  }
</script>
<style lang="less" scoped>
*{
  :deep(*) {
    .ant-progress-text {
      display: none;
    }
    .ant-progress-outer {
      margin-right: 0 !important;
      padding-right: 0 !important;
    }
    .ant-progress-inner {
      background: rgb(220, 221, 233);
    }
    nz-upload {
      cursor: pointer;
    }
    .warning-text {
      color: rgba(163, 133, 57, 0.85);
    }
    .icc-upload {
      padding: 0 25px;
      .row-item {
        line-height: 38px;
        .item-name {
          display: inline-block;
          width: 70px;
        }
        .radio-item {
          width: 100px;
        }
        .radio-item:nth-of-type(1) {
          margin-left: 10px;
        }
      }
      .upload-box {
        width: 85%;
        margin: 10px 0 20px 0;
        .show-input {
          height: 30px;
          color: #49536e;
          font-size: 14px;
          background: #fff;
        }
      }
      .limit-size {
        margin-top: 8px;
        color: #abb4cf;
        font-size: 12px;
      }
      .file-list {
        margin: 0;
        padding: 0;
        list-style: none;
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 8px 0;
          padding: 5px;
          border-radius: 2px;
          cursor: pointer;
          &:hover {
            background: rgb(240, 241, 249);
          }
          .left {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            i {
              margin-right: 10px;
              color: #4880ff;
              font-size: 16px;
            }
          }
          .right {
            cursor: pointer;
          }
        }
      }
      .progress-box {
        margin-bottom: 10px;
        padding: 10px 20px;
        font-size: 12px;
        background: rgb(240, 241, 249);
        border-radius: 2px;
      }
      .float-left {
        float: left;
      }
      .float-right {
        float: right;
      }
      .total-box {
        width: 100%;
        padding: 8px 8px 2px 8px;
        background: rgb(240, 241, 249);
        border-radius: 2px;
        .content {
          padding: 0 0 5px 42px;
        }
      }
    }
  }
}
</style>