import { NgModule } from "@angular/core";
import { SmsEditorComponent } from "./component/sms-editor/sms-editor.component";
import { SmsMobilePreviewComponent } from "./component/sms-mobile-preview/sms-mobile-preview.component";
import { SmsModalDetailComponent } from "./component/sms-modal-detail/sms-modal-detail.component";
import { SmsTimelineContentComponent } from "./component/sms-timeline-content/sms-timeline-content.component";
import { SmsTplAuditComponent } from "./component/sms-tpl-audit/sms-tpl-audit.component";
import { SmsTplAutoMatchComponent } from "./component/sms-tpl-auto-match/sms-tpl-auto-match.component";
import { SmsTplDetailComponent } from "./component/sms-tpl-detail/sms-tpl-detail.component";
import { SmsTplEditComponent } from "./component/sms-tpl-edit/sms-tpl-edit.component";
import { SmsAimLinkChooseComponent } from "./component/sms-aim-link-choose/sms-aim-link-choose.component";

import { CommonLibModule } from "@icc/common-lib";

import { SendDetailSmsComponent } from "./component/sms-sendDatail/sms.component";
import { SmsChannelEditComponent } from "./component/sms-channel/edit/edit.component";
import { SmsChannelAlarmComponent } from "./component/sms-channel/alarm/alarm.component";
import { SmsChannelPriceRateComponent } from "./component/sms-channel/price-rate/price-rate.component";
import { SmsChannelViewComponent } from "./component/sms-channel/view/view.component";
import { CommentSmsComponent } from "./component/sms-comment/sms.component";
// import { SmsConstraintKeywordComponent } from "./component/sms-sendconstraint-keyword/sms-sendconstraint-keyword.component";
import { SmsKeywordImportExportComponent } from "./component/sms-sendconstraint-keyword/import-export/import-export.component";
// import { SmsKeywordEditComponent } from "./component/sms-sendconstraint-keyword/edit/edit.component";
import { CostAccountingReportStatComponent } from "./component/sms-report/cost-accounting-report-stat/cost-accounting-report-stat.component";
import { CostAccountingReportTrendComponent } from "./component/sms-report/cost-accounting-report-trend/cost-accounting-report-trend.component";
import { ChannelSwitchHistoryComponent } from "./component/sms-channel-change/channel-switch-history/channel-switch-history.component";
import { ChannelAutoSwitchViewComponent } from "./component/sms-channel-change/channel-auto-switch/view/view.component";
import { ChannelAutoSwitchComponent } from "./component/sms-channel-change/channel-auto-switch/channel-auto-switch.component";
import { ChannelAutoSwitchEditComponent } from "./component/sms-channel-change/channel-auto-switch/edit/edit.component";
import { RouterModule } from "@angular/router";
// import { AutoBlackListSMSComponent } from "./component/sms-auto-black/sms.component";
import { AutoBlackListEditComponent } from "./component/sms-auto-black/edit/edit.component";
import { ParserPipe } from "./shared/pipes/parser.pipe";
// 消息自动应答
import { SmsAutoReplyComponent } from "./component/sms-auto-response/autoReply/autoReply.component";
import { SmsAutoReplyEditorComponent } from "./component/sms-auto-response/autoReply/edit/edit.component";
import { SmsAutoReplyViewerComponent } from "./component/sms-auto-response/autoReply/view/view.component";
import { SmsTplContentComponent } from "./component/sms-tpl-content/sms-tpl-content.component";
import { SmsSingleTplEditComponent } from "./component/sms-library-template/sms-single-tpl-edit/sms-single-tpl-edit.component";
import { MsgFormModule } from "@icc/share/msg-form";
import { EleAimLinkComponent } from "./component/sms-editor/ele/ele-aim-link/ele-aim-link.component";

// 自定义组件
const COMPONENTS = [
  SmsEditorComponent,
  SmsMobilePreviewComponent,
  SmsModalDetailComponent,
  SmsTimelineContentComponent,
  SmsTplAuditComponent,
  SmsTplAutoMatchComponent,
  SmsTplDetailComponent,
  SmsTplEditComponent,
  SmsAimLinkChooseComponent,

  // 消息自动应答
  SmsAutoReplyComponent,
  SmsAutoReplyEditorComponent,
  SmsAutoReplyViewerComponent,

  SendDetailSmsComponent,

  CommentSmsComponent,

  //渠道管理
  SmsChannelEditComponent,
  SmsChannelAlarmComponent,
  SmsChannelPriceRateComponent,
  SmsChannelViewComponent,
  // 敏感字管控
  // SmsConstraintKeywordComponent,
  SmsKeywordImportExportComponent,
  // SmsKeywordEditComponent,
  // 短信成本统计
  CostAccountingReportStatComponent,
  CostAccountingReportTrendComponent,
  // 短信渠道自动切换
  ChannelSwitchHistoryComponent,
  ChannelAutoSwitchComponent,
  ChannelAutoSwitchViewComponent,
  ChannelAutoSwitchEditComponent,
  // AutoBlackListSMSComponent,
  AutoBlackListEditComponent,
  //模板库
  SmsTplContentComponent,
  SmsSingleTplEditComponent,
  EleAimLinkComponent,
];

// 非场景
const ISNTCOMPONENTS = [];

const PIPES = [ParserPipe];

@NgModule({
  declarations: [...COMPONENTS, ...ISNTCOMPONENTS, ...PIPES],
  imports: [
    CommonLibModule,
    MsgFormModule,
    RouterModule,
    //IMPORTMODULES
  ],
  exports: [...COMPONENTS, ...ISNTCOMPONENTS, RouterModule],
})
export class SmsLibModule {}
