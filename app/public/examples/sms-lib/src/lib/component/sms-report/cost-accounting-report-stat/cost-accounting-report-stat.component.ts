import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { ActivatedRoute, Router } from "@angular/router";
import { STColumn, STComponent, STData, STPage, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import {
  format,
  differenceInCalendarDays,
  subDays,
  addDays,
  startOfMonth,
  startOfYear,
  differenceInDays,
  isFirstDayOfMonth,
  lastDayOfMonth,
  isValid,
} from "date-fns";
import echarts from "echarts";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-cost-accounting-report-stat",
  templateUrl: "./cost-accounting-report-stat.component.html",
  styleUrls: ["./cost-accounting-report-stat.component.less"],
})
export class CostAccountingReportStatComponent implements OnInit, OnDestroy {
  constructor(private dialogService: DialogService, private http: _HttpClient, private _activatedroute: ActivatedRoute, private router: Router) {}

  static NAME = "icc-msg-report-stat";

  url = URLS.costAccountingReportStat.url;

  subject = "成本核算";
  warning = "查询时间范围超过31天限制！";
  deptName: any;
  isOpenExport = false;
  trend: any = 0;
  showTrend: any = false;
  today = new Date();
  // 统计类型, 0:用户,1:部门, 2:业务模板, 3:渠道'
  statType: any = 0;
  statTypes: any = [
    { label: "用户", value: 0 },
    { label: "部门", value: 1 },
    { label: "业务模板", value: 2 },
    { label: "渠道", value: 3 },
  ];
  level = 2;
  groupLevel = [
    { label: "一级部门", value: 1 },
    { label: "二级部门", value: 2 },
    { label: "三级部门", value: 3 },
    { label: "四级部门", value: 4 },
  ];

  // 柱形图相关
  costAccountingBarChart: any;
  desNameList: Array<string>;
  sumCostList: Array<string>;

  @ViewChild("st", { static: false }) st: STComponent;
  columns: STColumn[] = [
    {
      title: "用户账号",
      width: 200,
      index: "desName",
      format: (item: STData, col: STColumn, index: number) => {
        return item.desName && item.desName.indexOf("]") > 0 ? item.desName.split("]")[0] + "]" : item.desName;
      },
      iif: item => this.statType === 0,
    },
    {
      title: "部门名称",
      width: 300,
      index: "desName",
      iif: item => this.statType === 1,
    },
    {
      title: "业务模板名称",
      width: 300,
      index: "desName",
      iif: item => this.statType === 2,
    },
    {
      title: "渠道名称",
      width: 300,
      index: "desName",
      iif: item => this.statType === 3,
    },
    {
      title: "所属部门",
      width: 400,
      index: "deptName",
      iif: item => this.statType === 0,
    },
    {
      title: "总成本(¥)",
      width: 200,
      index: "sumCost",
      className: "text-right",
      statistical: {
        type: "sum",
        digits: 4,
        currency: true,
      },
    },
    {
      title: "操作",
      width: 200,
      className: "text-center",
      buttons: [
        {
          text: "查看趋势",
          click: (item: any) => this.goTrend(item),
          acl: { ability: ["reportStat.costAccounting.trend"] },
        },
      ],
    },
  ];

  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      if (this.statType === 1) {
        requestOptions.body.params.level = this.level;
      }

      requestOptions.body.params.showTrend = this.showTrend;

      this.statType === undefined ? (requestOptions.body.params.statType = 0) : (requestOptions.body.params.statType = this.statType);

      this.trend === undefined ? (requestOptions.body.params.trend = 0) : (requestOptions.body.params.trend = this.trend);

      if (this.trend === 0) {
        if (requestOptions.body.params.startDate !== undefined && requestOptions.body.params.endDate !== undefined) {
          requestOptions.body.params.startDate = format(requestOptions.body.params.startDate, "yyyyMMdd");
          requestOptions.body.params.endDate = format(requestOptions.body.params.endDate, "yyyyMMdd");
        } else {
          requestOptions.body.params.startDate = format(startOfMonth(this.today), "yyyyMMdd");
          requestOptions.body.params.endDate = format(subDays(this.today, 1), "yyyyMMdd");
          // 当前日期为1号，则日趋势需要显示上个月的1号到月末
          // 月趋势时默认统计1月到本月的前一天的数据
          if (isFirstDayOfMonth(this.today)) {
            let day = subDays(this.today, 1);
            requestOptions.body.params.startDate = startOfMonth(day);
            requestOptions.body.params.endDate = lastDayOfMonth(day);
          }
        }
      } else {
        if (requestOptions.body.params.startMonth !== undefined && requestOptions.body.params.endMonth !== undefined) {
          requestOptions.body.params.startDate = format(requestOptions.body.params.startMonth, "yyyyMM");
          requestOptions.body.params.endDate = format(requestOptions.body.params.endMonth, "yyyyMM");
        } else {
          requestOptions.body.params.startDate = format(startOfYear(this.today), "yyyyMM");
          requestOptions.body.params.endDate = format(subDays(this.today, 1), "yyyyMM");
          // 一月一号
          if (differenceInDays(startOfYear(this.today), this.today) === 0) {
            requestOptions.body.params.startDate = startOfYear(this.today);
            requestOptions.body.params.endDate = startOfYear(this.today);
          }
        }
      }
      return requestOptions;
    },
  };

  res: STRes = {};
  page: STPage = {};

  /*searchOptions*/
  searchOptions: any = {
    desName: "",
    // dateRange: [getStartDate(new Date(), 1), getEndDate(new Date(), 1)],
    startDate: startOfMonth(this.today),
    endDate: subDays(this.today, 1),
  };
  expandForm = false;

  disabledDate = (current: Date): boolean => {
    // Can not select days before today and today
    return differenceInCalendarDays(current, this.today) > -1;
  };

  ngOnInit(): void {
    window.addEventListener("resize", this.resizeCharts);
    setTimeout(() => this.checkDateIsFirstDay(), 1);
    setTimeout(() => this.getTableList(), 10);
    // setTimeout(() => this.getTrend(), 10);
  }

  initTitleAndDateRange() {
    this._activatedroute.queryParams.subscribe(params => {
      if (params.statType) {
        this.statType = Number.parseInt(params.statType, 0);
      }
      if (params.desName) {
        this.searchOptions.desName = params.desName;
      }
      if (params.startDate && params.endDate) {
        // 转数字类型
        let startDate = new Date(params.startDate - 0);
        let endDate = new Date(params.endDate - 0);
        if (!isValid(startDate)) {
          startDate = new Date(params.startDate);
        }
        if (!isValid(endDate)) {
          endDate = new Date(params.endDate);
        }
        this.searchOptions.startDate = startDate;
        this.searchOptions.endDate = endDate;
      }
    });
  }

  checkDateIsFirstDay() {
    // 当前日期为1号，则日趋势需要显示上个月的1号到月末
    // 月趋势时默认统计1月到本月的前一天的数据
    if (isFirstDayOfMonth(this.today)) {
      let day = subDays(this.today, 1);
      this.searchOptions.startDate = startOfMonth(day);
      this.searchOptions.endDate = lastDayOfMonth(day);
    }
    // 一月一号
    if (differenceInDays(startOfYear(this.today), this.today) === 0) {
      this.searchOptions.startMonth = startOfYear(this.today);
      this.searchOptions.endMonth = startOfYear(this.today);
    }
  }

  getTableList() {
    // 控制可选范围为31天
    if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
      this.dialogService.notification.warning(this.subject, this.warning);
      return;
    }
    if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) < 0) {
      this.dialogService.notification.warning(this.subject, "起始时间应小于截止时间");
      return;
    }
    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        desName: this.searchOptions.desName,
        // dateRange: this.searchOptions.dateRange,
        startDate: this.searchOptions.startDate,
        endDate: this.searchOptions.endDate,
      },
    });
    this.getTrend();
  }

  resetTableList() {
    // 重置搜索条件
    this.searchOptions.desName = "";
    // this.searchOptions.dateRange = [];
    this.searchOptions.startDate = startOfMonth(this.today);
    this.searchOptions.endDate = subDays(this.today, 1);
    this.checkDateIsFirstDay();
    // 重新加载table数据
    this.getTableList();
  }

  trendChange() {
    this.getTableList();
  }

  statTypeChange() {
    // this.st.reset();
    this.getTrend();
    this.st.resetColumns({ columns: this.columns, emitReload: true });
    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        desName: this.searchOptions.desName,
        // dateRange: this.searchOptions.dateRange,
        startDate: this.searchOptions.startDate,
        endDate: this.searchOptions.endDate,
      },
    });
  }

  getStatTypeLable(): string {
    for (let type of this.statTypes) {
      if (type.value === this.statType) {
        return type.label;
      }
    }
    return "";
  }

  export() {
    // 判断前端表格是否有数据，如果没有，则直接返回“无数据可导出”
    if (!this.st._data || this.st._data.length === 0) {
      this.dialogService.notification.warning("导出", "无数据可导出");
      return;
    }
    this.http
      .post(URLS.costAccountingReportStatExport.url, {
        params: this.getParams(),
      })
      .subscribe(res => {
        if (res.status === 0) {
          this.isOpenExport = true;
        } else {
          this.dialogService.notification.error("导出", res.errorMsg);
        }
      });
  }

  goExport() {
    this.router.navigateByUrl("/system/import-export/export");
  }

  closeExport() {
    this.isOpenExport = false;
  }

  selectDate(event) {
    // 控制可选范围为31天
    if (!event && differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
      this.dialogService.notification.warning(this.subject, this.warning);
    }
  }

  goTrend(item) {
    this.router.navigate(["/icc-stat/reportStat/costAccounting/sms/trend"], {
      queryParams: {
        statType: item.statType,
        desId: item.desId,
        desName: item.desName,
        startDate: this.searchOptions.startDate,
        endDate: this.searchOptions.endDate,
        searchDesName: this.searchOptions.desName,
      },
    });
  }

  // 获取趋势图数据
  getTrend() {
    // 控制可选范围为31天
    if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
      return;
    }
    this.http.post(URLS.costAccountingReportStatTrend.url, this.getParams()).subscribe(res => {
      if (res.status === 0 && res.data) {
        this.desNameList = res.data.desNameList.map(name => {
          if (name && name.length > 15) {
            return name.substr(0, 15) + "...";
          } else {
            return name;
          }
        });
        console.log(this.desNameList);
        this.sumCostList = res.data.sumCostList;
        console.log(this.sumCostList);
        this.createBarChart("trend-chart");
      } else {
        this.dialogService.notification.error(this.subject, `获取${this.subject}趋势图失败`);
      }
    });
  }

  // 创建查询条件
  getParams(): any {
    let startDate;
    let endDate;
    if (this.trend === 0) {
      // 按日， 日趋势
      startDate = format(startOfMonth(this.today), "yyyyMMdd");
      endDate = format(subDays(this.today, 1), "yyyyMMdd");
      if (this.searchOptions.startDate && this.searchOptions.endDate) {
        startDate = format(this.searchOptions.startDate, "yyyyMMdd");
        endDate = format(this.searchOptions.endDate, "yyyyMMdd");
      }
    } else {
      // 按月，月趋势
      startDate = format(startOfYear(this.today), "yyyyMM");
      endDate = format(subDays(this.today, 1), "yyyyMM");
      if (this.searchOptions.startDate && this.searchOptions.endDate) {
        startDate = format(this.searchOptions.startDate, "yyyyMM");
        endDate = format(this.searchOptions.endDate, "yyyyMM");
      }
    }

    return {
      desName: this.searchOptions.desName,
      startDate,
      endDate,
      trend: this.trend,
      showTrend: this.showTrend,
      statType: this.statType,
      level: this.level,
    };
  }

  // 创建柱形图
  createBarChart(domId) {
    if (!this.costAccountingBarChart) {
      this.costAccountingBarChart = echarts.init(document.getElementById(domId) as HTMLDivElement);
    }
    this.costAccountingBarChart.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        top: "25%",
        left: "6%",
        right: "10%",
        bottom: "10%",
        containLabel: true,
      },
      yAxis: [
        {
          type: "value",
          splitLine: {
            lineStyle: {
              type: "solid",
              color: "#EAECF0",
            },
          },
          axisLine: {
            lineStyle: {
              color: "#ADB5D0",
            },
            show: true,
          },
          axisLabel: {
            color: "#ADB5D0",
            inside: false,
          },
          axisTick: {
            inside: false,
            show: false,
          },
          splitArea: {
            show: false,
          },
        },
      ],
      xAxis: [
        {
          type: "category",
          axisLabel: {
            show: true,
            margin: 10,
            interval: 0, // {number}表示隔几个标签显示一个标签

            textStyle: {
              fontSize: 12,
              fontWeight: 100,
              color: "#adb5d0",
            },
          },
          axisLine: {
            lineStyle: {
              color: "#ADB5D0",
            },
            show: true,
          },
          axisTick: {
            show: false,
          },
          data: this.desNameList,
        },
      ],
      series: [
        {
          type: "bar",
          barMinWidth: "25%",
          data: this.sumCostList,
          barWidth: 20,
          itemStyle: {
            normal: {
              color: "#28e810",
            },
          },
        },
      ],
    });
  }

  /* 随浏览改变而自适应 */
  resizeCharts = () => {
    if (this.costAccountingBarChart) {
      this.costAccountingBarChart.resize();
    }
  };

  ngOnDestroy() {
    window.removeEventListener("resize", this.resizeCharts);
  }

  test(s) {
    console.log(s);
  }
}
