<template><section>
<a-card :bordered='false'>
  <form :model='form' :label-col='{ span: 3 }' :layout="'horizontal'">
    <div class='content-wrapper'>
      <div class='top-wrapper'>
        <div class='strategy-box'>
          <label>管控类型：</label>
          <a-radio-group v-model:value='xxx.strategyType' @change='strategyTypeChange'>
            <a-radio value='4'>业务分类黑名单</a-radio>
            <a-radio value='2'>业务类型黑名单</a-radio>
            <a-radio value='0'>账号黑名单</a-radio>
            <a-radio value='1'>全局黑名单</a-radio>
          </a-radio-group>
        </div>
        <div class='account-box' v-if='strategyType == 0'>
          <a-form-item name='target' :rules="[{'required":true,"message":"请输入正确的关联账号","whitespace":true}]" class='control-nzselect' label='关联账号' class='form-item' required>
            <icc-select :options='getUserEnums'></icc-select>
          </a-form-item>
        </div>
        <div class='account-box' v-if='strategyType == 2'>
          <a-form-item name='target' :rules="[{'required":true,"message":"请输入正确的业务类型","whitespace":true}]" class='control-nzselect' label='关联业务类型' class='form-item' required>
            <icc-select :options='getBizEnums'></icc-select>
          </a-form-item>
        </div>
        <div class='account-box' v-if='strategyType == 4'>
          <a-form-item name='target' :rules="[{'required":true,"message":"请输入正确的业务分类","whitespace":true}]" class='control-nzselect' label='关联业务分类' class='form-item' required>
            <icc-select :options='getBizClassEnums'></icc-select>
          </a-form-item>
        </div>
      </div>
      <a-row gutter='24'>
        <a-col span='16' style='border: 1px solid gainsboro'>
          <form>
            <a-form-item style='margin: 17px 0 0 0' html-for='email' label='' :name="['[(ngModel)]"]">
                <div class='search-wrapper'>
                  <a-input style='width: 280px' type='text' :placeholder="'输入' + searchOptions.header" v-model:value='searchOptions.name' name='name'></a-input>
                  <icc-button :btn-type="'default'" @(btnClick='(e) => getTableList(true)' style='margin-left: 10px'>
                    <search-outlined></search-outlined>
                  </icc-button>
                </div>
              </a-form-item>
          </form>
          <st :page='{}' style='height: 340px; margin-top: 10px' ref='st' :width-mode="{ type: 'strict' }" :data='url' :columns='columns' :ps='pageSize' @(change='change' :res='res' :req='req' :page='page' :no-result='noResultRef'>
            <ng-template ref='noResultRef'>
              <div class='st-empty-box'>
                <img src='./assets/images/nothing/search.png' alt=''>
                <p class='empty-text'>抱歉，查询无此数据</p>
              </div>
            </ng-template>
            <ng-template st-row='templ-xwRegId' let-item let-index='index'>
              <icc-table-text :text-align="'left'" :text='item.openId'></icc-table-text>
            </ng-template>
            <ng-template st-row='templ-strategyTypeShow' let-item let-index='index'>
              {{ formatStrategy(item.strategyType) }}
            </ng-template>
          </st>
        </a-col>
        <a-col span='3' class='btn-box'>
          <icc-button style='margin-left: 15px' :is-loading='false' :btn-type="'default'" @(btnClick='addItem()' :is-disabled='checkedList.length < 1'>
            <span>添加已选</span>
          </icc-button>
        </a-col>
        <a-col class='gutter-row user-box' span='5'>
          <p class='title'>
            已选用户({{ selectList.length || 0 }})
            <button -button type='link' class='ico-deleted' title='清空' @(click='clearSelectList()'>
              <delete-outlined></delete-outlined>
            </button>
          </p>
          <div class='list-box'>
            <template v-for='(item, i ) in selectList'>
              <ul>
                <li class='list'>
                  <span class='name'>
                    <icc-table-text :text='item[searchOptions.field]' :width='100'></icc-table-text>
                  </span>
                  <delete-outline @(click='(e) => removeItem(i,item)'></delete-outline>
                </li>
              </ul>
            </template>
          </div>
        </a-col>
      </a-row>
    </div>
  </form>
</a-card>
<ng-template ref='totalTemplate'>
  <a-spin :spinning='listCountLoading' :size="'small'">共 {{ stTotal }} 条</a-spin>
</ng-template>
<question-outlined></question-outlined>
<question-outline></question-outline></section></template>