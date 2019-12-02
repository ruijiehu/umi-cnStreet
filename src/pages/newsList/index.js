import React, { PureComponent } from 'react';
import { connect } from 'dva';
@connect(({globalData})=>({
  globalData
}))

class newsList extends PureComponent {
  componentDidMount() {
    //注意务必先使用dva中的connect建立连接，否则是无法调用props中的dispatch法的
    this.props.dispatch({
        //调用model中的方法发起请求，（model的命名空间+方法名）
        type: 'globalData/getNewsList',
        //设置参数
        payload:{
          mediaType: 1,
          pageNum: 1
        },
    });
}
  render() {
    return (
      <div>
        测试列表哦
      </div>
    );
  }
}

export default newsList;