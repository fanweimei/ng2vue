import { SSrv } from "../typings";
import { processCdr } from "./cdr";
import { replaceDialog } from "./dialog";
import { processFormBuilder, replaceFormBuilder } from "./form";
import { processHttp } from "./http";
import { processModalHelper, replaceModalRef } from "./modal";
import { processNzModalService } from "./nzModal";
import { replaceRoute } from "./route";
import { processRouter, replaceRouter } from "./router";
import { replaceSt } from "./st";

export const processCtorSsrv = {
  [SSrv.router]: processRouter,
  [SSrv.modalHelper]: processModalHelper,
  [SSrv.fb]: processFormBuilder,
  [SSrv.ufb]: processFormBuilder,
  [SSrv.cdr]: processCdr,
  [SSrv.http]: processHttp,
  [SSrv.nzModal]: processNzModalService,
};

export const replaceCtorSsrv = {
  // [SSrv.http]: replaceHttp,
  [SSrv.modalRef]: replaceModalRef,
  [SSrv.ufb]: replaceFormBuilder,
  [SSrv.fb]: replaceFormBuilder,
  [SSrv.router]: replaceRouter,
  [SSrv.dialog]: replaceDialog,
  [SSrv.route]: replaceRoute
};

// 全局替换的方法
export const replaceGlobal = [replaceSt];
