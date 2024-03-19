import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import echarts from "echarts";
import { _HttpClient } from "@delon/theme";
import { ActivatedRoute, Router } from "@angular/router";
import { STColumn, STComponent, STData, STPage, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import {
  differenceInCalendarDays,
  format,
  isDate,
  isValid,
  startOfMonth,
  startOfYear,
  subDays,
  differenceInMonths,
  differenceInDays,
  lastDayOfMonth,
  isFirstDayOfMonth,
} from "date-fns";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-cost-accounting-report-trend",
  templateUrl: "./cost-accounting-report-trend.component.html",
  styleUrls: ["./cost-accounting-report-trend.component.less"],
})
export class CostAccountingReportTrendComponent implements OnInit, OnDestroy {
  constructor(private dialogService: DialogService, private http: _HttpClient, private _activatedroute: ActivatedRoute, private router: Router) {}

  static NAME = "icc-msg-report-trend";

  url = URLS.costAccountingReportStat.url;

  subject = "查看趋势";
  warning = "查询时间范围超过31天限制！";
  warning2 = "查询时间范围超过12个月限制！";
  isOpenExport = false;
  trend: any = 0;
  showTrend: any = true;
  today = new Date();
  // 统计类型, 0:用户,1:部门, 2:业务模板, 3:渠道'
  statType: any = 0;
  desId: any = 0;
  endOpen = false;

  // 头部显示 ： 短信：广州分行// user_001
  desName: any;
  queryParams: any;

  // 折线图相关
  startTime: any;
  endTime: any;
  lineChartIns: any;
  dateList: Array<string>;
  sumCostList: Array<string>;

  @ViewChild("st", { static: false }) st: STComponent;
  columns: STColumn[] = [
    {
      title: "用户账号",
      index: "desName",
      format: (item: STData, col: STColumn, index: number) => {
        return item.desName.indexOf("]") > 0 ? item.desName.split("]")[0] + "]" : item.desName;
      },
      iif: item => {
        return this.statType === 0;
      },
    },
    {
      title: "部门名称",
      index: "desName",
      iif: item => {
        return this.statType === 1;
      },
    },
    {
      title: "业务模板名称",
      index: "desName",
      iif: item => {
        return this.statType === 2;
      },
    },
    {
      title: "渠道名称",
      index: "desName",
      iif: item => {
        return this.statType === 3;
      },
    },
    {
      title: "所属部门",
      index: "deptName",
      iif: item => {
        return this.statType === 0;
      },
    },
    { title: "日期", index: "postDate" },
    { title: "总成本", index: "sumCost" },
  ];

  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {},
    process: (requestOptions: STRequestOptions) => {
      requestOptions.body.params.showTrend = this.showTrend;
      requestOptions.body.params.desId = this.desId;

      this.statType === undefined ? (requestOptions.body.params.statType = 0) : (requestOptions.body.params.statType = this.statType);

      this.trend === undefined ? (requestOptions.body.params.trend = 0) : (requestOptions.body.params.trend = this.trend);

      // if (this.trend === 0) {
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
          requestOptions.body.params.startDate = format(startOfMonth(day), "yyyyMMdd");
          requestOptions.body.params.endDate = format(lastDayOfMonth(day), "yyyyMMdd");
        }
      }
      // } else {
      if (requestOptions.body.params.startMonth !== undefined && requestOptions.body.params.endMonth !== undefined) {
        requestOptions.body.params.startMonth = format(requestOptions.body.params.startMonth, "yyyyMM");
        requestOptions.body.params.endMonth = format(requestOptions.body.params.endMonth, "yyyyMM");
      } else {
        requestOptions.body.params.startMonth = format(startOfYear(this.today), "yyyyMM");
        requestOptions.body.params.endMonth = format(subDays(this.today, 1), "yyyyMM");
        // 一月一号
        if (differenceInDays(startOfYear(this.today), this.today) === 0) {
          requestOptions.body.params.startMonth = format(startOfYear(this.today), "yyyyMM");
          requestOptions.body.params.endMonth = format(startOfYear(this.today), "yyyyMM");
        }
      }
      // }

      return requestOptions;
    },
  };
  res: STRes = {};
  page: STPage = {};

  /*searchOptions*/
  searchOptions: any = {
    // dateRange: [getStartDate(new Date(), 1), getEndDate(new Date(), 1)],
    startDate: startOfMonth(this.today),
    endDate: subDays(this.today, 1),
    startMonth: startOfYear(this.today),
    endMonth: subDays(this.today, 1),
  };
  expandForm = false;

  disabledDate = (current: Date): boolean => {
    // Can not select days before today and today
    return differenceInCalendarDays(current, this.today) > -1;
  };
  // 月趋势时间控件
  disabledStartMonth = (startValue: Date): boolean => {
    if (!startValue || !this.searchOptions.endMonth) {
      return false;
    }
    return startValue.getTime() > this.searchOptions.endMonth.getTime() || differenceInCalendarDays(startValue, this.today) > 0;
  };

  disabledEndMonth = (endValue: Date): boolean => {
    if (!endValue || !this.searchOptions.startMonth) {
      return false;
    }
    return endValue.getTime() <= this.searchOptions.startMonth.getTime() || differenceInCalendarDays(endValue, this.today) > 0;
  };

  onStartChange(date: Date): void {
    if (this.searchOptions.startMonth && this.searchOptions.endMonth) {
      if (differenceInMonths(this.searchOptions.endMonth, this.searchOptions.startMonth) > 11) {
        this.dialogService.notification.warning(this.subject, this.warning2);
      }
    }
    this.searchOptions.startMonth = date;
  }

  onEndChange(date: Date): void {
    if (this.searchOptions.startMonth && this.searchOptions.endMonth) {
      if (differenceInMonths(this.searchOptions.endMonth, this.searchOptions.startMonth) > 11) {
        this.dialogService.notification.warning(this.subject, this.warning2);
      }
    }
    this.searchOptions.endMonth = date;
  }
  // end 月趋势时间控件

  ngOnInit(): void {
    window.addEventListener("resize", this.resizeCharts);
    setTimeout(() => this.checkDateIsFirstDay(), 1);
    setTimeout(() => this.getTableList(), 10);
    this.initTitleAndDateRange();
    // setTimeout(() => this.st.resetColumns(), 10);
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

  initTitleAndDateRange() {
    this._activatedroute.queryParams.subscribe(params => {
      this.queryParams = params;
      if (params.statType) {
        this.statType = Number.parseInt(params.statType, 0);
      }
      if (params.desId) {
        this.desId = params.desId;
      }
      if (params.desName) {
        this.desName = params.desName;
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

  getTableList() {
    if (this.trend === 0) {
      // 控制可选范围为31天
      if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
        this.dialogService.notification.warning(this.subject, this.warning);
        return;
      }
      if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) < 0) {
        this.dialogService.notification.warning(this.subject, "起始时间应小于截止时间");
        return;
      }
    } else {
      // 控制可选范围为12个月
      if (differenceInMonths(this.searchOptions.endMonth, this.searchOptions.startMonth) > 11) {
        this.dialogService.notification.warning(this.subject, this.warning2);
        return;
      }
      if (differenceInCalendarDays(this.searchOptions.endMonth, this.searchOptions.startMonth) < 0) {
        this.dialogService.notification.warning(this.subject, "起始时间应小于截止时间");
        return;
      }
    }

    this.st.reset({
      params: {
        // key: value  =》 接口参数名: 对应值
        startDate: this.searchOptions.startDate,
        endDate: this.searchOptions.endDate,
        startMonth: this.searchOptions.startMonth,
        endMonth: this.searchOptions.endMonth,
      },
    });
    this.getTrend();
  }

  resetTableList() {
    // 重置搜索条件
    // this.searchOptions.dateRange = [];
    this.searchOptions.startDate = startOfMonth(this.today);
    this.searchOptions.endDate = subDays(this.today, 1);
    this.searchOptions.startMonth = startOfYear(this.today);
    this.searchOptions.endMonth = subDays(this.today, 1);
    this.checkDateIsFirstDay();
    // 重新加载table数据
    this.getTableList();
  }

  trendChange() {
    this.getTableList();
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

  goBack() {
    this.router.navigate(["/icc-stat/reportStat/costAccounting"], {
      queryParams: {
        statType: this.queryParams.statType,
        desName: this.queryParams.searchDesName,
        startDate: this.queryParams.startDate,
        endDate: this.queryParams.endDate,
      },
    });
  }

  selectDate(event) {
    // 控制可选范围为31天
    if (this.trend === 0 && !event && differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
      this.dialogService.notification.warning(this.subject, this.warning);
    }
  }

  // 获取趋势图数据
  getTrend() {
    if (this.trend === 0) {
      // 控制可选范围为31天
      if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) > 30) {
        return;
      }
      if (differenceInCalendarDays(this.searchOptions.endDate, this.searchOptions.startDate) < 0) {
        this.dialogService.notification.warning(this.subject, "起始时间应小于截止时间");
        return;
      }
    } else {
      // 控制可选范围为12个月
      if (differenceInMonths(this.searchOptions.endMonth, this.searchOptions.startMonth) > 11) {
        return;
      }
      if (differenceInCalendarDays(this.searchOptions.endMonth, this.searchOptions.startMonth) < 0) {
        this.dialogService.notification.warning(this.subject, "起始时间应小于截止时间");
        return;
      }
    }

    this.http.post(URLS.costAccountingReportStatTrend.url, this.getParams()).subscribe(res => {
      if (res.status === 0 && res.data) {
        this.dateList = res.data.dateList;
        this.startTime = res.data.dateList[0];
        this.endTime = res.data.dateList[this.dateList.length - 1];

        this.sumCostList = res.data.sumCostList;
        this.createLineChart("trend-chart");
      } else {
        this.dialogService.notification.error(this.subject, `获取${this.subject}趋势图失败`);
      }
    });
  }

  // 创建查询条件
  getParams(): any {
    let startDate;
    let endDate;
    let startMonth;
    let endMonth;
    // if (this.trend === 0) {
    // 按日， 日趋势
    if (this.searchOptions.startDate && this.searchOptions.endDate) {
      startDate = format(this.searchOptions.startDate, "yyyyMMdd");
      endDate = format(this.searchOptions.endDate, "yyyyMMdd");
    } else {
      startDate = format(startOfMonth(this.today), "yyyyMMdd");
      endDate = format(subDays(this.today, 1), "yyyyMMdd");
    }
    // } else {
    // 按月，月趋势
    if (this.searchOptions.startMonth && this.searchOptions.endMonth) {
      startMonth = format(this.searchOptions.startMonth, "yyyyMM");
      endMonth = format(this.searchOptions.endMonth, "yyyyMM");
    } else {
      startMonth = format(startOfYear(this.today), "yyyyMM");
      endMonth = format(subDays(this.today, 1), "yyyyMM");
    }
    // }

    return {
      startDate,
      endDate,
      startMonth,
      endMonth,
      trend: this.trend,
      showTrend: this.showTrend,
      statType: this.statType,
      desId: this.desId,
    };
  }

  // 创建折线图
  createLineChart(domId) {
    if (!this.lineChartIns) {
      this.lineChartIns = echarts.init(document.getElementById(domId) as HTMLDivElement);
    }
    this.lineChartIns.setOption({
      color: ["#28e810"],
      legend: { data: ["总成本"], left: "right" },
      tooltip: {
        trigger: "axis",
      },
      grid: {
        left: "0%",
        right: "0%",
        top: "20px",
        bottom: "5px",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          boundaryGap: false,
          data: this.dateList,
          axisLine: {
            lineStyle: {
              color: "#EAE3F0",
            },
          },
          axisLabel: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
      ],
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
            show: false,
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
      series: [
        {
          name: "总成本",
          type: "line",
          data: this.sumCostList,
          areaStyle: {
            normal: {
              color: "#58d3ff",
              opacity: 0.15,
            },
          },
          lineStyle: {
            normal: {
              width: 2,
              color: "#28e810",
            },
          },
          itemStyle: {
            normal: {
              opacity: 0,
            },
          },
          smooth: true,
        },
      ],
    });
  }

  /* 随浏览改变而自适应 */
  resizeCharts = () => {
    if (this.lineChartIns) {
      this.lineChartIns.resize();
    }
  };

  ngOnDestroy() {
    window.removeEventListener("resize", this.resizeCharts);
  }
}
