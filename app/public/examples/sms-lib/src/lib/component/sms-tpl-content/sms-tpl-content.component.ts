import { Component, OnInit } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { DialogService } from "@icc/common-lib";

@Component({
  selector: "icc-sms-tpl-content",
  templateUrl: "./sms-tpl-content.component.html",
  styleUrls: ["./sms-tpl-content.component.less"],
})
export class SmsTplContentComponent implements OnInit {
  constructor(private http: _HttpClient, private dialogService: DialogService) {}

  static NAME = "icc-msg-tpl-content";

  name: string;

  content: string;

  patchStrategy: any[];

  serverUrl: string;

  ngOnInit() {}

}
