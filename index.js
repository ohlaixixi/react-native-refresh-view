
import React, { Component, PropTypes } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  NetInfo
} from 'react-native';
const imageH = 80;
export default class RefreshScrollView extends Component {
  static propTypes = {
    onRefresh: PropTypes.func,
    onLoadMore: PropTypes.func,
    onScroll: PropTypes.func,
    listViewProps: PropTypes.object,//传入外部的listView
    // onEndReached: PropTypes.func,
    // onEndReachedThreshold: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.state = {
      showAnima: false,
      refreshState: this.refreshDown,
      contentInset: 0
    };

    this.refreshUp ='refreshUp';
    this.refreshDown = 'refreshDown';
    this.refreshing = 'refreshing';
    this.refreshed = 'refreshSuccess';
    this.refreshFailed = 'refreshFailed';
    // scrollview是否处于拖动状态
    this.scrollViewDrag = false;
    // 是否正在加载中
    this.loading = false;
    this.footerLoading = false;
  }

  onScroll(e) {
    if (this.props.listViewProps) {
      this.props.listViewProps.onScroll(e);
    }

    let target = e.nativeEvent;
    let contentOffsetY = target.contentOffset.y;
    // console.log(contentOffsetY);
    if (this.scrollViewDrag) {
        if (contentOffsetY < -imageH) { //显示释放刷新
          this.upState();
        } else {
          this.downState();
        }
    }
    // this.onEndReached(target,e);
  }

  upState() {
    if (this.loading) {
      return;
    }
    this.setState(Object.assign({}, this.state, {
      refreshState: this.refreshUp
    }));
  }

  downState() {
    if (this.loading) {
      return;
    }
    this.setState(Object.assign({}, this.state, {
      refreshState: this.refreshDown
    }));
  }

  onScrollViewBeginDragging() {
    this.scrollViewDrag = true;
    if (this.props.onScrollBeginDrag) {
      this.props.onScrollBeginDrag();
    }
  }

  onScrollViewEndDragging() {
    this.scrollViewDrag = false;
    if (this.loading) {
      return;
    }
    if (this.state.refreshState == this.refreshUp) {
      this.setState(Object.assign({}, this.state, {contentInset:imageH,refreshState: this.refreshing}), () => {
        // 回到待收起状态
        this.scrollView.scrollTo({x:0,y:-imageH,animated:true});
        NetInfo.fetch().done((reach) => {
          if (reach == 'none') {
              // 没有网络
            setTimeout(() => {
              this.scrollView.scrollTo({x:0, y:0, animated:true});
              this.loading = false;
              this.setState(Object.assign({},this.state,{
                refreshState: this.refreshFailed,
                contentInset: -20}));
              this.timer && clearInterval(this.timer);
            }, 2000);
          }
        });
      });
      this.loading = true;
      // 来回切换图片形成动画效果
      this.timer = setInterval(() => {
        this.setState(Object.assign({}, this.state, {
          refreshState: this.refreshing,
          showAnima: !this.state.showAnima
        }))
      },900);
      // 回调外部传入的下拉刷新
      if (this.props.onRefresh) {
        this.props.onRefresh(this);
      }
    }
  }

  onEndReached(target,e) {
    if (this.footerLoading) {
      return;
    }
    let contentSizeH = target.contentSize.height;
    let contentOffsetY = target.contentOffset.y;
    let layoutMeasurementH = target.layoutMeasurement.height;
    // let endReachedThreshold = this.props.onEndReachedThreshold ? this.props.onEndReachedThreshold : 0;
    if (contentSizeH - layoutMeasurementH - contentOffsetY  < 40) {
      console.log('调用上拉加载');
      this.footerLoading = true;
      // 触发外部的滚动加载方法
      // if (this.props.onEndReached) {
      //   this.props.onEndReached(this);
      // }
    }
  }

  onRefreshEnd(refreshType) { // header footer
    if (refreshType == 'header') {
      this.scrollView.scrollTo({x:0, y:0, animated:true});
      // 刷新结束 更改状态 清除定时器
      this.loading = false;
      this.setState(Object.assign({},this.state,{
        refreshState: this.refreshed,
        contentInset: -20}));
      this.timer && clearInterval(this.timer);
    } else {

    }
  }

  scrollTo(object) {
    this.scrollView.scrollTo({x:object.x, y:object.y, animated:object.animated});
  }

  renderImageContent() {
    if(this.state.refreshState == this.refreshUp) {
      return (<Image source={require('../resources/refresh/refreshUp.png')} />);
    }
    else if (this.state.refreshState == this.refreshing) {
      return this.state.showAnima ?
        (<Image source={require('../resources/refresh/refreshing1.png')} />) :
        (<Image source={require('../resources/refresh/refreshing2.png')} />);
    }
    else if (this.state.refreshState == this.refreshed) {
      return (<Image source={require('../resources/refresh/refreshSuccess.png')} />);
    }
    else if (this.state.refreshState == this.refreshFailed) {
      return (<Image source={require('../resources/refresh/refreshFailed.png')} />);
    }
    else {
      return (<Image source={require('../resources/refresh/refreshDown.png')} />);
    }
  }

  renderPullRefreshContent() {
    return (
      <View style={styles.pullRefresh}>
          {this.renderImageContent()}
      </View>
    );
  }

  render() {
    return (
      <ScrollView
        ref={(scrollView) => this.scrollView = scrollView}
        {...this.props}
        scrollEventThrottle={1}
        onScrollBeginDrag={() => this.onScrollViewBeginDragging()}
        onScrollEndDrag={() => this.onScrollViewEndDragging()}
        onScroll={(e) => this.onScroll(e)}
        contentInset={{top:this.state.contentInset}}
        contentOffset={{x:0, y:0}}
        onContentSizeChange={(contentWidth, contentHeight) => {console.log(contentWidth,contentHeight);}}
        >
          {this.renderPullRefreshContent()}
          {this.props.children}
      </ScrollView>
    );
  }
}
const styles = StyleSheet.create({
  pullRefresh: {
    position: 'absolute',
    top: -imageH,
    left: 0,
    right: 0,
    height: imageH,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
