// import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
// import { NzModalRef } from "ng-zorro-antd/modal";
// import { _HttpClient } from "@delon/theme";
// import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from "@angular/forms";
// import { MessageService, DialogService } from "@icc/common-lib";
// import { URLS } from "../../../shared/constant/interface";

// @Component({
//   selector: "app-sms-sendconstraint-keyword-edit",
//   templateUrl: "./edit.component.html",
//   styleUrls: ["./edit.component.less"],
// })
// export class SmsKeywordEditComponent implements OnInit {
//   static NAME = "sendconstraint-keyword-edit";

//   constructor(
//     private messageService: MessageService,
//     private modal: NzModalRef,
//     public http: _HttpClient,
//     private fb: UntypedFormBuilder,
//     private dialogService: DialogService,
//   ) {}
//   bizEnums: any[] = [];
//   bizEnumsBack: any[] = [];
//   channelEnums: any[] = [];
//   channelEnumsBack: any[] = [];
//   userEnums: any[] = [];
//   userEnumsBack: any[] = [];
//   bizClassEnums: any[] = [];
//   bizClassEnumsBack: any[] = [];
//   record: any;
//   subject = "敏感字管控";
//   msgType = this.messageService.getMsgTypeByName("sms", true);
//   logicKeywordCont: boolean = true;
//   keywordRepe: boolean = true;
//   checkExistWord: String;

//   form: UntypedFormGroup = this.fb.group({
//     id: new UntypedFormControl(null),
//     keywordType: new UntypedFormControl("1", [Validators.required]),
//     keyword: new UntypedFormControl(null, [Validators.required, Validators.maxLength(100), Validators.pattern(/^[\s\S]*.*[^\s][\s\S]*$/)]),
//     targetId: new UntypedFormControl(null, [Validators.required]),
//     controlType: new UntypedFormControl("5", [Validators.required]),
//     controlStrategy: new UntypedFormControl("1", [Validators.required]),
//     logicKeyword: new UntypedFormControl("-1", [Validators.required]),
//     keywordRepe: new UntypedFormControl("-1", [Validators.required]),
//   });

//   // 默认值为关联业务分类
//   controlType = 5;
//   // 默认值为单一敏感字
//   keywordType = 1;

//   ngOnInit() {
//     this.getUser();
//     this.getBizs();
//     this.getChannels();
//     this.getBizsClass();
//   }
//   getUser() {
//     this.http.post(URLS.keywordAllUsers.url + "/0").subscribe(res => {
//       this.buildArray(res.data, this.userEnums, this.userEnumsBack);
//       if (this.record.id > 0) {
//         // 目标账户
//         this.form.get("controlType")?.setValue(this.record.controlType + "");
//         this.form.get("keyword")?.setValue(this.record.keyword);
//         this.form.get("keywordType")?.setValue(this.record.keywordType + "");
//         this.form.get("controlStrategy")?.setValue(this.record.controlStrategy + "");
//         this.form.get("id")?.setValue(this.record.id);
//         this.form.get("targetId")?.setValue(this.record.targetId);
//         this.controlType = this.record.controlType;
//         this.checkExist(this.record.keyword);
//       }
//     });
//   }
//   getBizs() {
//     this.http.post(URLS.keywordAllBizs.url + this.msgType + (this.record.id > 0 ? "/-1" : "/1")).subscribe(res => {
//       this.buildArray(res.data, this.bizEnums, this.bizEnumsBack);
//     });
//   }
//   getChannels() {
//     this.http.post(URLS.keywordAllChannels.url + this.msgType + "/1").subscribe(res => {
//       this.buildArray(res.data, this.channelEnums, this.channelEnumsBack);
//     });
//   }
//   //TODO: 添加接口并修改此处
//   getBizsClass() {
//     this.http.post(URLS.keywordAllBizs.url + this.msgType + (this.record.id > 0 ? "/-1" : "/1")).subscribe(res => {
//       this.buildArray(res.data, this.bizClassEnums, this.bizClassEnumsBack);
//     });
//   }
//   controlTypeChange(value: any) {
//     // switchcase语句走的全等判断，需要对value进行处理
//     switch (+value) {
//       case 1:
//         this.form.get("targetId")?.setValue(0);
//         this.controlType = value;
//         break;
//       case 2:
//       case 3:
//       case 4:
//       case 5:
//         this.form.get("targetId")?.setValue(null);
//         this.controlType = value;
//         break;
//       default:
//         break;
//     }
//     if (this.record.controlType != 1 && this.controlType != 1) {
//       this.form.get("targetId")?.setValue(this.record.targetId);
//     }
//   }

//   checkUnique() {
//     if (this.form.get("keyword")?.value) {
//       this.checkExist(this.form.get("keyword")?.value);
//     }
//   }
//   keywordTypeChange(value: any) {
//     if (value == 1) {
//       this.keywordType = 1;
//       this.logicKeywordCont = true;
//       this.form.get("logicKeyword")?.setValue("-1");
//       this.checkExist(this.form.get("keyword")?.value);
//     } else {
//       this.keywordType = 2;
//       this.isValidLogicKeyword(this.form.get("keyword")?.value || "");
//     }
//   }

//   isValidLogicKeyword(s) {
//     let offset = 1;
//     let orflag = 0;
//     let andflag = 0;
//     if (this.keywordType !== 1) {
//       this.keywordRepe = true;
//       if (s.indexOf("|") === 0 || s.indexOf("&") === 0 || s.lastIndexOf("&") === s.length - 1 || s.lastIndexOf("|") === s.length - 1) {
//         offset = 0;
//       }
//       for (let i = 0; i < s.length; i++) {
//         let c = s.charAt(i);
//         if ("|" == c && "|" == s.charAt(i + 1)) {
//           orflag = 1;
//         }
//         if ("|" == c && andflag === 1) {
//           offset = 0;
//         }
//         if ("|" == c && "|" != s.charAt(++i)) {
//           offset = 0;
//         }
//         if ("&" == c && "&" == s.charAt(i + 1)) {
//           andflag = 1;
//         }
//         if ("&" == c && orflag === 1) {
//           offset = 0;
//         }
//         if ("&" == c && "&" != s.charAt(++i)) {
//           offset = 0;
//         }
//       }
//       if (offset === 0 || (orflag === 0 && andflag === 0)) {
//         this.logicKeywordCont = false;
//         this.form.get("logicKeyword")?.setValue(null);
//       } else {
//         this.logicKeywordCont = true;
//         this.form.get("logicKeyword")?.setValue("-1");
//       }
//     }
//     if (!this.logicKeywordCont) {
//       return;
//     }
//     this.checkExist(s);
//   }

//   checkExist(s) {
//     if (!s) s = "";
//     this.checkExistWord = s;
//     if (s?.trim().length > 0) {
//       // 唯一性校验
//       this.http
//         .post(URLS.keywordList.url, {
//           params: {
//             keyword: s,
//             targetId: this.form.get("targetId")?.value,
//             msgType: this.msgType,
//             keywordType: this.form.get("keywordType")?.value,
//             controlType: this.form.get("controlType")?.value,
//             check: true,
//           },
//           ps: 1,
//           pi: 1,
//         })
//         .subscribe(res => {
//           if (res.total !== 0 && this.checkExistWord === s) {
//             if (res.list[0].id == this.record.id) {
//               this.keywordRepe = true;
//               this.form.get("keywordRepe")?.setValue("-1");
//             } else {
//               this.keywordRepe = false;
//               this.form.get("keywordRepe")?.setValue(null);
//             }
//           } else {
//             this.keywordRepe = true;
//             this.form.get("keywordRepe")?.setValue("-1");
//           }
//         });
//     } else {
//       this.keywordRepe = true;
//       this.form.get("keywordRepe")?.setValue("-1");
//     }
//   }

//   save(value: any) {
//     // 表示短信类型
//     value.msgType = this.msgType;
//     console.log(value);
//     if (value.strategyType == 1) {
//       value.target = 0;
//     }
//     let url = value.id ? URLS.keywordEdit.url : URLS.keywordAdd.url;
//     this.http.post(url, value).subscribe(res => {
//       if (res.status === 0) {
//         this.dialogService.notification.success(this.subject, `敏感字管控${this.record.id > 0 ? "编辑" : "新增"}成功`);
//         this.modal.close(true);
//       } else {
//         this.dialogService.notification.error(this.subject, res.errorMsg);
//       }
//     });
//   }
//   close() {
//     this.modal.destroy();
//   }

//   buildArray(sourceData, enums, enumsBack) {
//     if (sourceData && sourceData.length > 0) {
//       sourceData.forEach(item => {
//         enums.push({ label: item.name, value: item.id });
//         enumsBack.push({ label: item.name, value: item.id });
//       });
//     }
//   }
//   onFilters(value, sourceList, target) {
//     let temp = value ? sourceList.filter(e => e.label.indexOf(value) > -1) : sourceList;
//     switch (+target) {
//       case 2:
//         this.userEnums = temp;
//         break;
//       case 3:
//         this.bizEnums = temp;
//         break;
//       case 4:
//         this.channelEnums = temp;
//         break;
//       case 5:
//         this.bizClassEnums = temp;
//         break;
//       default:
//         break;
//     }
//   }
// }
