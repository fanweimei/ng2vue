/*
 * Public API Surface of sms-lib
 */

export * from "./lib/component/sms-editor/sms-editor.component";
export * from "./lib/component/sms-mobile-preview/sms-mobile-preview.component";
export * from "./lib/component/sms-modal-detail/sms-modal-detail.component";
export * from "./lib/component/sms-timeline-content/sms-timeline-content.component";
export * from "./lib/component/sms-tpl-audit/sms-tpl-audit.component";
export * from "./lib/component/sms-tpl-auto-match/sms-tpl-auto-match.component";
export * from "./lib/component/sms-tpl-detail/sms-tpl-detail.component";
export * from "./lib/component/sms-tpl-edit/sms-tpl-edit.component";

// 消息自动应答
export * from "./lib/component/sms-auto-response/autoReply/autoReply.component";
export * from "./lib/component/sms-auto-response/autoReply/edit/edit.component";
export * from "./lib/component/sms-auto-response/autoReply/view/view.component";

// 发送详情
export * from "./lib/component/sms-sendDatail/sms.component";

// 接收记录
export * from "./lib/component/sms-comment/sms.component";

//渠道管理
export * from "./lib/component/sms-channel/view/view.component";
export * from "./lib/component/sms-channel/edit/edit.component";
export * from "./lib/component/sms-channel/alarm/alarm.component";
export * from "./lib/component/sms-channel/price-rate/price-rate.component";

// 敏感字管控
// export * from "./lib/component/sms-sendconstraint-keyword/sms-sendconstraint-keyword.component";
export * from "./lib/component/sms-sendconstraint-keyword/import-export/import-export.component";
// export * from "./lib/component/sms-sendconstraint-keyword/edit/edit.component";

// 成本统计
export * from "./lib/component/sms-report/cost-accounting-report-stat/cost-accounting-report-stat.component";
export * from "./lib/component/sms-report/cost-accounting-report-trend/cost-accounting-report-trend.component";

// 短信渠道自动切换
export * from "./lib/component/sms-channel-change/channel-switch-history/channel-switch-history.component";
export * from "./lib/component/sms-channel-change/channel-auto-switch/view/view.component";
export * from "./lib/component/sms-channel-change/channel-auto-switch/channel-auto-switch.component";
export * from "./lib/component/sms-channel-change/channel-auto-switch/edit/edit.component";

// 自动加黑
// export * from "./lib/component/sms-auto-black/sms.component";
export * from "./lib/component/sms-auto-black/edit/edit.component";

// 模板库
export * from "./lib/component/sms-tpl-content/sms-tpl-content.component";
export * from "./lib/component/sms-library-template/sms-single-tpl-edit/sms-single-tpl-edit.component";

export * from "./lib/component/sms-aim-link-choose/sms-aim-link-choose.component";

export * from "./lib/msgconf-helper/index";
export * from "./lib/msgconf-helper/charge-helper";
export * from "./lib/msgconf-helper/control-helper";
export * from "./lib/msgconf-helper/standard-helper";
export * from "./lib/msgconf-helper/standard-message-helper";
export * from "./lib/msgconf-helper/stat-helper";

export * from "./lib/shared/constant/interface";
export * from "./lib/shared/constant/msgType";

export * from "./lib/component/sms-tpl-edit/sms-tpl-strategies";

export * from "./lib/sms-lib.module";
