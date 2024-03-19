import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { _HttpClient } from '@delon/theme';
import { AppPluginsFilterService, CommonLibModule, DialogService } from '@icc/common-lib';
import { MSG_APPTYEP, MSG_TYPE } from '../../../shared/constant/msgType';
import { SmsSingleTplEditComponent } from './sms-single-tpl-edit.component';

interface SmsSingleTplEditComponentElements {
  nameElement: HTMLInputElement;
  contentElement: HTMLDivElement;
  saveBtnElement: HTMLButtonElement
}

describe('SmsSingleTplEditComponent', () => {
  const componentName = '短信模板编辑组件';

  let component: SmsSingleTplEditComponent;

  let fixture: ComponentFixture<SmsSingleTplEditComponent>;

  const tplRecord = {
    name: "unitTestName-0123456789abcdefr",
    content: "unitTestContent-我是模板内容"
  };

  let pageElements: SmsSingleTplEditComponentElements = {
    nameElement: null!,
    contentElement: null!,
    saveBtnElement: null!,
  };

  let initData = () => {
    const { name, content } = tplRecord;
    sessionStorage.setItem("MSG_LIBRARY_TEMP", JSON.stringify({
      id: 1,
      name,
      content,
      msgType: MSG_TYPE,
      applicationType: MSG_APPTYEP.common
    }))
  }

  let timeout = () => {
    return new Promise((resolve, reject) => {
      setTimeout(res => {
        resolve(res);
      }, 500)
    });
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonLibModule,
        RouterTestingModule
      ],
      declarations: [ SmsSingleTplEditComponent ],
      providers: [
        AppPluginsFilterService,
        DialogService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    initData();
    fixture = TestBed.createComponent(SmsSingleTplEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(`${componentName}: 组件创建`, () => {
    expect(component).toBeTruthy();
  });

  it(`${componentName}: 模板名称双向绑定`, (done) => {
    timeout().then(() => {
      pageElements.nameElement = fixture.nativeElement.querySelector('input');
      expect(component.editRecord.name).toBe(pageElements.nameElement.value);
      done();
    })
  });

  it(`${componentName}: 模板内容双向绑定`, (done) => {
    timeout().then(()=>{
      pageElements.contentElement = fixture.nativeElement.querySelector('.mockTextarea');
      expect(component.editRecord.content).toBe(pageElements.contentElement.textContent!);
      done();
    })
  });

  it(`${componentName}: 保存按钮启用状态`, (done) => {
    timeout().then(()=>{
      pageElements.saveBtnElement = fixture.nativeElement.querySelector('button');
      expect(pageElements.saveBtnElement.disabled).toBeFalsy();
      done();
    })
  });

  // it(`${componentName}: 保存按钮禁用状态 - 模板名称为空`, (done) => {
  //   timeout().then(()=>{
  //     component.editRecord.name = '';
  //     fixture.nativeElement.querySelector('input').value = "";
  //     fixture.detectChanges();
  //     expect(pageElements.saveBtnElement.disabled).toBeTruthy();
  //     done();
  //   })
  // });

});
