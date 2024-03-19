/**
 * 常量
 */
const isMock = false;
const apiPrefix = isMock ? "" : "icc/service";

export function getUrl(url, name?) {
  return { url: apiPrefix + url, name };
}
export const appInfo = {
  name: "应急事件",
  title: "融合消息管理系统",
};

export const URLS: any = {
  getFunctionTypes: getUrl("/common/functionTypes", "获取插件应用"),
  getUserSignature: getUrl("/system/user/getSignature", "获取账号签名"),

  templatePatchGroup: getUrl("/business/template/patchGroup/list", "模板可使用的贴片组"),
  templatePatchGroupItem: getUrl("/business/template/patchGroup/patchItem", "模板可使用的贴片组里面的贴片项"),

  attachment: getUrl("/common/attachment/download", "附件下载"),
  uploadImage: getUrl("/message/send/common/uploadSendImage", "上传图片"),
  msgSendPatchGroupUrl: getUrl("/message/send/patchGroup/list", "上传图片"),
  msgSendPatchItemUrl: getUrl("/message/send/patchGroup/patchItem", "发送中心"),

  addSmsChannelManagement: getUrl("/information/channelManagement/sms/add", "短信渠道新增"),
  editSmsChannelManagement: getUrl("/information/channelManagement/sms/edit", "短信渠道编辑"),
  searchChannelProvider: getUrl("/information/channelProvider/getList", "渠道商搜索"),
  smsChannelRegion: getUrl("/information/channelManagement/region", "地区列表获取"),
  oneSmsChannel: getUrl("/information/channelManagement/val/one/", "短信渠道信息获取"),
  // 短信渠道费率与告警
  getSmsChannelManagementPriceRate: getUrl("/information/channelManagement/sms/priceRate", "短信渠道获取费率"),
  SmsChannelManagementPriceRateHistory: getUrl("/information/channelManagement/sms/priceRate/history", "短信渠道查看费率修改历史"),
  getSmsChannelManagementChannelAlarm: getUrl("/information/channelManagement/sms/channelAlarm", "短信渠道获取告警配置"),
  getSmsChannelManagementChannelAlarmAccount: getUrl("/information/channelManagement/sms/channelAlarm/getAccounts", "短信渠道告警通知人员获取"),
  // end

  checkChannelName: getUrl("/information/channelManagement/val/checkName", "校验渠道名"),
  checkChannelIdentity: getUrl("/information/channelManagement/val/checkIdentity", "校验渠道标识"),
  checkChannelCarrierBizTypeBind: getUrl("/information/channelManagement/val/checkCarrier", "检验渠道运营商是否关联业务模板"),
  channelManagementCheckProvince: getUrl("/information/channelManagement/val/checkProvince", "校验当前渠道是否有关联业务模板"),
  // #common resource
  msgTypes: getUrl("/common/msgTypes", "消息类型"),
  resendMsg: getUrl("/msgRecord/sendRecord/resendTicket", "消息重发"),
  resendMsgCount: getUrl("/msgRecord/sendRecord/resendTicketDetail", "消息重发获取统计数量"),
  sendRecordDetail: getUrl("/msgRecord/sendRecord/detailList", "发送记录详情"),
  getMoContent: getUrl("/msgRecord/moRecord/getMoContent", "获取上行内容详情"),
  smsSendRecordDetail: getUrl("/msgRecord/sendRecord/detail/" + 0, "发送记录短信发送详情"),
  smsSendDetail: getUrl("/msgRecord/sendDetail/list/sms/", "短信发送详情"),
  smsSendDetailExport: getUrl("/msgRecord/sendDetail/export/sms", "短信发送详情导出"),
  smsSubList: getUrl("/msgRecord/sendDetail/list/sms/getSubList", "短信分段列表"),

  bizCatsSendRecord: getUrl("/msgRecord/sendRecord/bizCats", "获取发送记录业务分类"),
  bizsSendRecord: getUrl("/msgRecord/sendRecord/bizs", "获取发送记录业务模板"),
  bizCatsSendDetail: getUrl("/msgRecord/sendDetail/bizCats", "获取发送详情业务分类"),
  bizsSendDetail: getUrl("/msgRecord/sendDetail/bizs", "获取发送详情业务模板"),

  smsMoRecord: getUrl("/msgRecord/moRecord/list/sms", "短信上行记录"),
  smsMoRecordListCount: getUrl("/msgRecord/moRecord/list/sms/listCount", "短信上行记录数量"),
  smsMoRecordExport: getUrl("/msgRecord/moRecord/export/sms", "短信上行记录导出"),

  smsMoRecordManuallyCallBack: getUrl("/msgRecord/moRecord/manuallyCallBack", "手动回复"),
  // sms auto reply urls start
  smsAutoReply: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/list", "查询"),
  smsAutoReplyAdd: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/add", "新增"),
  smsAutoReplyEdit: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/edit", "编辑"),
  smsAutoReplyDelete: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/delete", "删除"),
  smsAutoReplyActive: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/keyword/active", "启停"),
  smsAutoReplyDetail: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/detail", "查看详情"),
  smsAutoReplyGetAccounts: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/getAccounts", "关联账号获取"),
  smsAutoReplyKeywordExist: getUrl("/msgRecord/msgAutomationEngine/autoReply/sms/keywordExist", "keyword远程唯一性校验"),
  // sms auto reply urls end

  // auto blackList sms urls start
  smsAutoBlackList: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/list", "查询"),
  smsAutoBlackListAdd: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/add", "新增"),
  smsAutoBlackListEdit: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/edit", "编辑"),
  smsAutoBlackListDelete: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/delete", "删除"),
  smsAutoBlackListActive: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/active", "启停"),
  smsAutoBlackListDetail: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/detail", "查看详情"),
  smsAutoBlackListGetAccounts: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/getAccounts", "关联账号获取"),
  smsAutoBlackListGetChannels: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/getChannels", "关联渠道获取"),
  smsAutoBlackListGetBizTypes: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/getBizTypes", "关联业务模板获取"),
  smsAutoBlackListKeywordExist: getUrl("/msgRecord/msgAutomationEngine/autoBlacklist/sms/keywordExist", "keyword远程唯一性校验"),
  // auto blackList sms urls end

  // 敏感字管控
  keywordAllUsers: getUrl("/sendconstraint/keyword/users", "查询所有用户"),
  keywordAllBizs: getUrl("/sendconstraint/keyword/bizs/", "查询所有业务模板"),
  keywordAllChannels: getUrl("/sendconstraint/keyword/channels/", "查询所有渠道"),
  keywordList: getUrl("/sendconstraint/keyword/list", "获取敏感字列表"),
  keywordAdd: getUrl("/sendconstraint/keyword/add", "新增敏感字"),
  keywordEdit: getUrl("/sendconstraint/keyword/edit", "编辑敏感字"),
  keywordDel: getUrl("/sendconstraint/keyword/delete", "删除敏感字"),
  keywordImport: getUrl("/sendconstraint/keyword/import/handle", "导入敏感字"),
  keywordUploadPercent: getUrl("/sendconstraint/keyword/import/uploadState", "上传敏感字进度查看"),
  keywordExport: getUrl("/sendconstraint/keyword/export", "导出敏感字"),

  // channel switch config start
  channelAutoSwitch: getUrl("/information/channelChange/channelAutoSwitch/list", "自动切换配置列表"),
  channelAutoSwitchAdd: getUrl("/information/channelChange/channelAutoSwitch/add", "自动切换配置新增"),
  channelAutoSwitchEdit: getUrl("/information/channelChange/channelAutoSwitch/edit", "自动切换配置编辑"),
  channelAutoSwitchDelete: getUrl("/information/channelChange/channelAutoSwitch/delete", "自动切换配置删除"),
  channelAutoSwitchBatchDelete: getUrl("/information/channelChange/channelAutoSwitch/delete", "自动切换配置批量删除"),
  channelAutoSwitchActive: getUrl("/information/channelChange/channelAutoSwitch/active", "自动切换配置启停"),
  channelAutoSwitchDetail: getUrl("/information/channelChange/channelAutoSwitch/detail", "自动切换配置详情"),
  channelAutoSwitchChannelInfo: getUrl("/information/channelChange/channelAutoSwitch/channelInfo", "获取渠道信息"),
  channelAutoSwitchManualSwitch: getUrl("/information/channelChange/channelAutoSwitch/manualSwitch", "手动切换渠道"),
  channelAutoSwitchCheckChannelAvailable: getUrl("/information/channelChange/channelAutoSwitch/checkChannelAvailable", "检测要切换的渠道状态"),
  channelAutoSwitchCheckCarriersAutoSwitch: getUrl("/information/channelManagement/val/checkCarriersAutoSwitch", "检验渠道运营商在短信自动切换中是否合法"),
  channelAutoSwitchCheckProvincesAutoSwitch: getUrl(
    "/information/channelManagement/val/checkProvincesAutoSwitch",
    "检验渠道可发送省份在短信自动切换中是否合法",
  ),

  channelAutoSwitchSaveNotice: getUrl("/information/channelChange/channelAutoSwitch/saveNoticeTerminal/", "保存渠道切换通知人"),
  channelSwitchHistory: getUrl("/information/channelChange/channelSwitchHistory/list", "切换历史列表"),

  costAccountingReportStat: getUrl("/reportStat/costAccounting/list", "成本核算列表查询"),
  costAccountingReportStatExport: getUrl("/reportStat/costAccounting/export", "成本核算导出"),
  costAccountingReportStatTrend: getUrl("/reportStat/costAccounting/trend", "成本核算图表查询"),
  // end report stat
  // 模板库 sms
  msgTemplateLibraryList: getUrl("/business/library/sms/tplManager/list", "消息模板列表"),
  msgTemplateLibraryAdd: getUrl("/business/library/sms/tplManager/add", "消息模板新增"),
  msgTemplateLibraryEdit: getUrl("/business/library/sms/tplManager/update", "消息模板编辑"),
  msgTemplateLibraryActive: getUrl("/business/library/sms/tplManager/updateState", "消息模板启停"),
  msgTemplateLibraryDetail: getUrl("/business/library/sms/tplManager/id", "获取消息模板详情"),
  msgTemplateLibraryNameValid: getUrl("/business/library/sms/tplManager/checkTemplateName", "消息模板名称校验"),
  msgTemplateLibraryDelete: getUrl("/business/library/sms/tplManager/delete", "消息模板删除"),
  getVariableInfoByCodeList: getUrl("/information/bizVariable/listByCodeIn", "根据变量Code数组获取对应变量信息数组"),
  // M消息相关
  getAimLinkList: getUrl("/aimLinkManage/getAimLinkList", "获取M消息链接列表"),
  getAimLinkListStatus: getUrl("/aimLinkManage/getAimLink", "获取M消息链接状态"),
  aimTemplateList: getUrl("/business/library/aim/listAndDetail", "获取M消息模板列表"),
  aimTemplateInfoById: getUrl("/common/aim/getTplContent", "根据模板ID获取模板信息"),
  aimTplDetail: getUrl("/business/library/aim/detail", "根据模板主键查询M消息模板详情"),
};
export function getUrlName(url: string) {
  if (url) {
    for (let item in URLS) {
      /*IE不支持inclueds*/
      // if (url.includes(URLS[item].url)) {
      if (url.indexOf(URLS[item].url) !== -1) {
        return URLS[item].name;
      }
    }
  }
  return url;
}
