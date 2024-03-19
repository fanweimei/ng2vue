import { Component, OnInit } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd/modal";

@Component({
  selector: "app-sms-auto-reply-view",
  templateUrl: "./view.component.html",
  styles: [],
})
export class SmsAutoReplyViewerComponent implements OnInit {
  constructor(private modal: NzModalRef) {}

  record: any;

  ngOnInit() {}

  close() {
    this.modal.close(true);
  }
}
