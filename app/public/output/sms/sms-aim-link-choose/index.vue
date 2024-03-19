<template>
<section><div class="modal-header modal-header-update header-cls">
  <div class="modal-title title">{{ subject }}</div>
</div>
<div class="content">
  <form :layout="'inline'">
    <a-row :gutter="{ xs: 8, sm: 8, md: 8, lg: 24, xl: 48, xxl: 48 }">
      <a-col md="12" sm="24">
        <a-form-item html-for="linkType" :label-col="{'span':10}" label="链接类型" :wrapper-col="{'span':14}" :name="['linkType']">
            <a-radio-group v-model:value="searchOptions.linkType" @change="linkTypeChange" name="linkType">
              <a-radio :value="1">群发链接</a-radio>
              <a-radio :value="2">个性链接</a-radio>
            </a-radio-group>
          </a-form-item>
      </a-col>
      <a-col md="12" sm="24">
        <a-form-item html-for="jobName" :label-col="{'span':10}" label="链接任务名称" :wrapper-col="{'span':14}" :name="['jobName']">
            <a-input v-model:value="searchOptions.jobName" placeholder="请输入链接任务名称" name="jobName" id="jobName"></a-input>
          </a-form-item>
      </a-col>
      <a-col md="12" sm="24" v-if="searchOptions.linkType === 1 && expandForm">
        <a-form-item html-for="aimUrl" :label-col="{'span':10}" label="M消息链接" :wrapper-col="{'span':14}" :name="['aimUrl']">
            <a-input v-model:value="searchOptions.aimUrl" placeholder="请输入完整的M消息链接" name="aimUrl" id="aimUrl"></a-input>
          </a-form-item>
      </a-col>

      <a-col md="12" sm="24" v-if="expandForm">
        <a-form-item html-for="creator" :label-col="{'span':10}" label="创建人" :wrapper-col="{'span':14}" :name="['creator']">
            <a-input v-model:value="searchOptions.creator" placeholder="请输入创建人" name="creator" id="creator"></a-input>
          </a-form-item>
      </a-col>
      <a-col md="12" sm="24" v-if="expandForm">
        <a-form-item html-for="expireTime" :label-col="{'span':10}" label="到期时间" :wrapper-col="{'span':14}" :name="['startExpireTime']">
            <a-range-picker extend v-model:value="searchOptions.startExpireTime" :(ng-model-end)="searchOptions.endExpireTime" format="yyyy-MM-dd" :allow-clear="false" :show-time="false"></a-range-picker>
          </a-form-item>
      </a-col>
    </a-row>
    <div :class.text-right="expandForm" class="search-btns">
      <icc-button :btn-type="'default'" @btnClick="getTableList">
        <span>查询</span>
      </icc-button>
      <icc-button :btn-type="'hollow'" @btnClick="resetTableList">
        <span>重置</span>
      </icc-button>
      <a class="expand-box" @click="expandForm = !expandForm">
        {{ expandForm ? "收起" : "展开" }}
        <icc-arrow :expand="expandForm"></icc-arrow>
      </a>
    </div>
  </form>
  <icc-dynamic-table ref="st" :scroll="{ x: '649px' }" :data="url" :columns="columns" :res="res" :req="req" @change="stChange">
    <template #tpl-jobName="item">
      <icc-table-text :text="item.jobName" :width="100"></icc-table-text>
    </template>
    <template #tpl-aimUrl="item">
      <icc-table-text :text="item.aimUrl ? item.aimUrl : '-'" :width="100"></icc-table-text>
    </template>
    <template #tpl-generateNum="item">
      <icc-table-text :text="item.generateNum" :width="100"></icc-table-text>
    </template>
    <template #tpl-unresolvedNum="item">
      <icc-table-text :text="item.unresolvedNum" :width="100"></icc-table-text>
    </template>
    <template #tpl-creator="item">
      <icc-table-text :text="item.creator" :width="100"></icc-table-text>
    </template>
    <template #multi-sign="item">
      <icc-table-text :text="item.smsSign" :width="100"></icc-table-text>
      </template>
  </icc-dynamic-table>
</div>
<div class="modal-footer modal-footer-update footer-cls">
  <icc-button :btn-type="'hollow'" @btnClick="close">
    <span>关闭</span>
  </icc-button>
  <icc-button :btn-type="'default'" :is-disabled="!selectedRows" @btnClick="save">
    <span>保存</span>
  </icc-button>
</div></section>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { format } from "date-fns";
import { getEndDate, getStartDate } from "@icc/utils";
import { DynamicTableInstance, Req, Res, TableColumn } from "@icc/components/icc-dynamic-table";
import { useNotification } from "@icc/hooks";
import { http } from "@icc/api";
import { URLS } from "../../shared/constant/interface";

const dialogService = useNotification();

defineOptions({
	name: 'AppSmsAimLinkChoose',
});

const emits = defineEmits(["close"]);
let st: DynamicTableInstance;
let total: number = 0;
let templateId: string = "";
const subject = ref<string>("M消息链接选择");
const expandForm = ref<boolean>(false);
const url = ref(URLS.getAimLinkList.url);
const columns = ref<TableColumn[]>([
    {
      title: "",
      index: "id",
      type: "radio",
      width: 50,
      fixed: "left",
      className: "text-center",
    },
    {
      title: "链接任务名称",
      render: "tpl-jobName",
      width: 132,
      className: "text-center",
    },
    {
      title: "短信签名",
      className: "text-break text-center",
      render: "multi-sign",
      width: 150,
    },
    {
      title: "M消息链接",
      render: "tpl-aimUrl",
      iif: () => searchOptions.linkType === 1,
      width: 132,
      className: "text-center",
    },
    {
      title: "生成数量",
      render: "tpl-generateNum",
      width: 132,
      className: "text-center",
    },
    {
      title: "剩余解析数量",
      render: "tpl-unresolvedNum",
      width: 132,
      className: "text-center",
    },
    {
      title: "创建人",
      render: "tpl-creator",
      width: 132,
      className: "text-center",
    },
    {
      title: "创建时间",
      index: "createTime",
      type: "date",
      width: 140,
      dateFormat: "yyyy-MM-dd",
      className: "text-center",
    },
    {
      title: "到期时间",
      index: "expireTime",
      type: "date",
      width: 140,
      dateFormat: "yyyy-MM-dd",
      className: "text-center",
    },
  ]);
const selectedRows = ref<any | null>(null);
const searchOptions = reactive<any>({
    linkType: 1,
    jobName: "",
    aimUrl: "",
    creator: "",
    // generateNum: null,
    // unresolvedNum: null,
    startExpireTime: null,
    endExpireTime: null,
    linkStatus: 2,
  });
const res = reactive<Res>({
    process: (data, rawData) => {
      total = rawData.total;
      return data;
    },
  });
const req = reactive<Req>({
    method: "POST",
    allInBody: true,
    lazyLoad: true,
    body: {
      params: {
        templateId: templateId,
        linkType: searchOptions.linkType,
        linkStatus: searchOptions.linkStatus,
        jobName: searchOptions.jobName,
        aimUrl: searchOptions.aimUrl,
        creator: searchOptions.creator,
        startExpireTime: searchOptions.startExpireTime ? format(new Date(searchOptions.startExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
        endExpireTime: searchOptions.endExpireTime ? format(new Date(searchOptions.endExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
      },
    },
    process: (requestOptions: any) => {
      return requestOptions;
    },
  });

onMounted(() => {
    resetTableList();
  })

function resetSearchOptions() {
    // 重置搜索条件
    searchOptions.jobName = "";
    searchOptions.aimUrl = "";
    searchOptions.creator = "";
    // searchOptions.generateNum = null;
    // searchOptions.unresolvedNum = null;
    // format(getStartDate(new Date(), 6), "yyyy-MM-dd HH:mm:ss")
    searchOptions.startExpireTime = null;
    searchOptions.endExpireTime = null;
  }

function getTableList() {
    st.reset({
      params: {
        templateId: templateId,
        linkType: searchOptions.linkType,
        linkStatus: searchOptions.linkStatus,
        jobName: searchOptions.jobName,
        aimUrl: searchOptions.aimUrl,
        creator: searchOptions.creator,
        startExpireTime: searchOptions.startExpireTime ? format(new Date(searchOptions.startExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
        endExpireTime: searchOptions.endExpireTime ? format(new Date(searchOptions.endExpireTime), "yyyy-MM-dd HH:mm:ss") : null,
      },
    });
  }

function linkTypeChange($event) {
    searchOptions.linkType = $event;
    resetSearchOptions();
    st.resetColumns({ columns: columns.value, emitReload: true });
    getTableList();
  }

function resetTableList() {
    resetSearchOptions();
    // 重新加载table数据
    getTableList();
  }

function stChange(e: any) {
    switch (e.type) {
      case "radio":
        selectedRows.value = e.radio || null;
        break;
      case "pi":
        selectedRows.value = null;
        break;
    }
  }

function close() {
    emits('close');
  }

function save() {
    if (!selectedRows.value) {
      dialogService.warning(subject.value, "请选择M消息链接！");
    }
    let result = {
      linkType: searchOptions.linkType,
      ...selectedRows.value,
    };

    emits('close', result);
  }
</script>
<style lang="less" scoped>
.content {
  nz-form-label {
    width: 106px !important;
  }

  .search-btns {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }
}
</style>