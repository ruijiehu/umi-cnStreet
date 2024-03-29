import axios from "axios";
const wsBaseUrl = "ws://192.168.3.136:8885/wangdian";
// 保存当前辖区信息，设置登录页当前辖区标题
let resdata = "";
// 清除左右空格
function trim(s) {
  return s.toString().replace(/(^\s*)|(\s*$)/g, "");
}
// 可视化后台指标组装
function makeLegendData(data) {
  let newdata = data.rows.map(row => {
    let resultMap = {};
    data.cols.forEach(col => {
      resultMap[col.name] = row.cells[col.id];
    });
    return resultMap;
  });
  return newdata;
}
function formatDate(date, format) {
  let o = {
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  };
  if (/(y+)/.test(format)) {
    format = format.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (let k in o) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return format;
}
function getDateStr(AddDayCount, format = "yyyy-MM-dd") {
  let dd = new Date();
  let time = dd.getTime() + AddDayCount * 24 * 3600 * 1000;
  let newDate = new Date(time);
  return formatDate(newDate, format);
}
// 将yyyy-MM-dd格式的日期字符串转为date
function parseymd2Date(dateStr) {
  let dateArr = dateStr.split("-");
  let newdate = new Date(dateArr[0], dateArr[1], dateArr[2]);
  return newdate;
}

// 获得两个日期之间相差的天数
function getDays(date1, date2, split = /[-|' ']/) {
  let date1Str = date1.split(split); // 将日期字符串分隔为数组,数组元素分别为年.月.日
  // 根据年 . 月 . 日的值创建Date对象
  let date1Obj = new Date(date1Str[0], date1Str[1] - 1, date1Str[2]);
  let date2Str = date2.split(split);
  let date2Obj = new Date(date2Str[0], date2Str[1] - 1, date2Str[2]);
  let t1 = date1Obj.getTime();
  let t2 = date2Obj.getTime();
  let dateTime = 1000 * 60 * 60 * 24; // 每一天的毫秒数
  let minusDays = Math.floor((t2 - t1) / dateTime); // 计算出两个日期的天数差
  return minusDays;
}

// 跳转到登录页面
function goLogin(region) {
  // 退出登录时获取region
  if (region) {
    resdata = region;
  }
  // eslint-disable-next-line
let path = window.location.origin+window.location.pathname
  // eslint-disable-next-line
let h = new Buffer(path)
  let h64 = h.toString("base64");
  window.location.href =
    "/apollo/login?service=" + h64 + "&page=6&region=" + resdata;
}

// 获取登录的token
function getLogin(resdt) {
  resdata = resdt.data.region;
  axios.get("/apollo/token").then(res => {
    if (res.data.data.isLogin) {
      checkToken(res.data.data.token);
    } else {
      goLogin();
    }
  });
}

// 检查token是否合法
function checkToken(token) {
  axios
    .post("/wuzhen/sso/checktoken?token" + token)
    .then(res => {
      if (res.data.status === 200 && res.data.success) {
        axios
          .get("/wuzhen/userinfo")
          .then(response => {
            if (!response.data || !response.data.data.userId) {
              goLogin();
            } else {
              window.vm.$bus.emit("getUserInfo");
            }
            // window.location.reload()
          })
          .catch(error => {
            console.log(error);
          });
      }
    })
    .catch(error => {
      console.log(error);
      goLogin();
    });
}

// 空的字段设置为-
function setDefaultValues(data, replaceStr = "--") {
  let rt = data.map(item => {
    for (let i in item) {
      if (item[i] === null || item[i] === undefined) {
        item[i] = replaceStr;
      }
    }
    return item;
  });
  return rt;
}
// 获取当前时间为"yyyy-MM-dd"
function getCurrentDate(date) {
  var needDate = "";
  var editDate = date || new Date().toLocaleDateString();
  if (Number(editDate.split("/")[2]) > 9) {
    needDate =
      editDate.split("/")[0] +
      "-0" +
      editDate.split("/")[1] +
      "-" +
      editDate.split("/")[2];
  } else {
    needDate =
      editDate.split("/")[0] +
      "-0" +
      editDate.split("/")[1] +
      "-0" +
      editDate.split("/")[2];
  }
  return needDate;
}
// 是否是一个Promise
function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === "object" || typeof obj === "function") &&
    typeof obj.then === "function"
  );
}
// 查找树节点路径
function getNodePaths(list, key, value) {
  let arr = [];
  function getPath(list) {
    list.forEach(item => {
      arr.push(item[key]);
      if (item[key] === value) {
        return arr;
      } else {
        if (item.children && item.children.length > 0) {
          getPath(item.children);
        } else {
          arr.pop();
        }
      }
    });
    return arr;
  }
  return getPath(list);
}
function getTreeNode(list, key, value) {
  let cell = {};
  function getNode(list) {
    list.forEach(item => {
      if (item[key] === value) {
        cell = item;
        return cell;
      } else {
        if (item.children && item.children.length > 0) {
          getNode(item.children);
        }
      }
    });
    return cell;
  }
  return getNode(list);
}
function treeToArr(treeArr) {
  let arr = [];
  function toArr(list) {
    list.forEach(item => {
      let cell = Object.assign({}, item);
      arr.push(cell);
      if (item.children && item.children.length > 0) {
        toArr(item.children);
      }
    });
  }
  toArr(treeArr);
  return arr;
}
function showThisMenuEle(item, subMenus, navMenus) {
  if (item.meta) {
    if (
      subMenus.indexOf(item.meta.code) >= 0 ||
      navMenus.indexOf(item.meta.code) >= 0
    ) {
      return true;
    }
  }
  return false;
}
// 重组菜单
function getMenuListByAccess(list, subMenus, navMenus) {
  let res = [];
  list.forEach(item => {
    if (item.meta) {
      if (item.children) {
        item.children = getMenuListByAccess(item.children, subMenus, navMenus);
      }
      if (showThisMenuEle(item, subMenus, navMenus)) res.push(item);
    }
  });
  return res;
}
let util = {
  trim,
  wsBaseUrl,
  makeLegendData,
  getDateStr,
  goLogin,
  getLogin,
  checkToken,
  parseymd2Date,
  getDays,
  formatDate,
  setDefaultValues,
  isPromise,
  getNodePaths,
  treeToArr,
  getTreeNode,
  getMenuListByAccess,
  showThisMenuEle,
  resdata
};
export {
  trim,
  wsBaseUrl,
  makeLegendData,
  getDateStr,
  goLogin,
  getLogin,
  checkToken,
  resdata,
  parseymd2Date,
  getDays,
  formatDate,
  setDefaultValues,
  getCurrentDate,
  getNodePaths
};
export default util;
