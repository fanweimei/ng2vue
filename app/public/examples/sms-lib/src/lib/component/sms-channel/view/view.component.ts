import { Component, OnInit } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { UntypedFormBuilder } from "@angular/forms";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-view",
  templateUrl: "./view.component.html",
  styleUrls: ["./view.component.less"],
})
export class SmsChannelViewComponent implements OnInit {
  static SCENE = "icc-msg-channel-view";
  channel: any = {
    carriers: String,
  };
  record: any = {};
  /* 省份数据 */
  provincesList: any[] = [];
  optionList: any[] = [];
  constructor(public http: _HttpClient, private fb: UntypedFormBuilder) {}
  regionList: any[] = [];
  ngOnInit() {
    console.log(22200010);
    const urlSel = URLS.searchChannelProvider.url;
    if (this.record.id > 0) {
      this.http.post(URLS.smsChannelRegion.url, 0).subscribe(res2 => {
        this.regionList = res2.data;

        this.http.post(urlSel, this.record.msgType).subscribe(res => {
          this.optionList = res.data;
          this.optionList.forEach(res1 => {
            if (res1.id === this.record.providerId) {
              this.http.post(URLS.oneSmsChannel.url + this.record.id).subscribe(param => {
                const params = param.data;
                this.channel.providerName = res1.name;
                this.channel.speed = params.speed;
                this.channel.identity = params.identity;
                this.channel.channelNum = params.channelNum;
                this.channel.name = params.name;
                this.channel.appId = params.appId;
                this.channel.appKey = params.appKey;
                this.channel.appSecret = params.appSecret;
                this.channel.hostname = params.hostname;
                this.channel.port = params.port;
                this.channel.corpID = params.corpID;
                this.channel.serviceID = params.serviceID;
                this.channel.extendLength = params.extendLength;
                this.channel.supportAllProvinces = params.supportAllProvinces;
                this.channel.showSupportProvinces = params.supportAllProvinces ? "全国" : this.formatSupportProvincesList(params.supportProvincesList);

                this.channel.maxLength = params.maxLength;
                this.channel.moWaitTime = params.moWaitTime;
                this.channel.carrier = params.carrierId;
                this.channel.extend = params.extend;
                this.channel.extendNumLength = params.extendNumLength;
                this.channel.supportSignature = params.supportSignature;
                this.channel.signature = params.signature;

                if (params.protocolVersion === "20") {
                  this.channel.protocolVersion = "CMPP2.0(移动)";
                } else if (params.protocolVersion === "12") {
                  this.channel.protocolVersion = "SGIP1.2(联通)";
                } else if (params.protocolVersion === "48") {
                  this.channel.protocolVersion = "SMGP3.0(电信)";
                } else if (params.protocolVersion === "33") {
                  this.channel.protocolVersion = "CMPP3.0(移动)";
                } else if (params.protocolVersion === "0") {
                  this.channel.protocolVersion = "其他协议";
                }

                if (params.carrierId === 1) {
                  this.channel.carrier = "移动";
                } else if (params.carrierId === 2) {
                  this.channel.carrier = "联通";
                } else if (params.carrierId === 3) {
                  this.channel.carrier = "电信";
                }
                // 地区

                this.regionList.forEach(region => {
                  if (region.id === params.regionId) {
                    this.channel.region = region;
                    this.channel.regionName = region.name;
                  }
                });
                this.regionList.forEach(region => {
                  if (region.id === this.channel.region.parentId) {
                    this.channel.parentRegion = region.name;
                  }
                });
                if (params.parametersViewList != null) {
                  params.parametersViewList.forEach(element => {
                    if ("userfeetype" === element.key) {
                      this.channel.userfeetype = element.value;
                    } else if ("billingnumber" === element.key) {
                      this.channel.billingnumber = element.value;
                    } else if ("feetype" === element.key) {
                      this.channel.feetype = element.value;
                    } else if ("feecode" === element.key) {
                      this.channel.feecode = element.value;
                    }
                  });
                }

                this.channel.msgTypes = params.longSms ? "短信,长短信" : "短信";
                this.channel.supportStateReport = params.supportStateReport ? "是" : "否";
                this.channel.supportMo = params.supportMo ? "是" : "否";
                this.channel.carriers = "";
                params.carriers.forEach(element => {
                  if (element === 1) {
                    this.channel.carriers += "移动,";
                  } else if (element === 2) {
                    this.channel.carriers += "联通,";
                  } else if (element === 3) {
                    this.channel.carriers += "电信,";
                  }
                });
                this.channel.carriers = this.channel.carriers.substring(0, this.channel.carriers.length - 1);
              });
            }
          });
        });
      });
    } else {
      // this.http.get(url)
      this.http.post(urlSel, 2).subscribe(res => {
        this.optionList = res.data;
      });
    }
  }

  // 可发送省份数据格式化
  formatSupportProvincesList(list) {
    let showProvincesList: any[] = [];
    showProvincesList = list?.map(id => {
      return this.provincesList?.find(item => item.id === id).name;
    });
    return showProvincesList.join(",");
  }
}
