const cp = require("child_process");
const fs = require("fs");
const path = require("path");

// 获取微信开发者工具的cli指令(Mac)
const cli = "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
// 获取微信开发者工具的cli指令(Windows)
// const cli = "开发工具安装位置/cli.bat";

// 当前小程序项目地址（替换成自己的）
const projectDir = "/xxxx/xxxx";

// 定义当前版本号
const VERSION = "1.0.0";
// 定义当前版本代码的说明
const UPDATE_MESSAGE = "init msg";

// 定义当前需要上传的小程序
const list = [
  { appId: "appId1", appName: "小程序名称1" },
  { appId: "appId2", appName: "小程序名称2" },
];

// 窗口执行命令工具方法
function exec(cmdStr) {
  return new Promise((resolve, reject) => {
    cp.exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        reject(`执行命令失败: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

// 更新project.config.json文件中的appId
async function updateAppId(appId) {
  try {
    const projectPath = path.join(projectDir, "project.config.json");
    let data = await fs.promises.readFile(projectPath, "utf8");
    let jsonData = JSON.parse(data);
    jsonData.appid = appId;
    await fs.promises.writeFile(projectPath, JSON.stringify(jsonData, null, 2));
    console.log(`更新 appId 为 ${appId} 成功`);
  } catch (e) {
    console.error("更新 project.config.json 文件失败", e);
    throw new Error("更新 project.config.json 文件失败");
  }
}

// 主方法，执行上传操作
async function main() {
  try {
    console.log("准备工作：检查是否已经登录工具...");
    const isLoggedIn = await exec(`${cli} islogin`);
    console.log(isLoggedIn);

    console.log("准备工作：打开指定项目...");
    const openProject = await exec(`${cli} open --project ${projectDir}`);
    console.log(openProject);

    console.log("准备工作：自动预览项目...");
    await exec(`${cli} auto-preview --project ${projectDir}`);
    console.log("自动预览完成");

    // 批量上传小程序
    for (let item of list) {
      try {
        console.log(`开始上传小程序：${item.appName}（appId: ${item.appId})`);

        console.log("步骤 1：更新 project.config.json 中的 appId...");
        await updateAppId(item.appId);

        console.log("步骤 2：上传代码审核...");
        const uploadResult = await exec(
          `${cli} upload --project ${projectDir} -v ${VERSION} -d ${UPDATE_MESSAGE}`
        );
        console.log(uploadResult);

        console.log(`小程序 ${item.appName}（appId: ${item.appId}) 上传完成`);
      } catch (err) {
        console.error(`上传小程序 ${item.appName}（appId: ${item.appId}) 时发生错误: `, err);
      }
    }

    console.log("上传完成，退出微信开发者工具...");
    const quitResult = await exec(`${cli} quit`);
    console.log(quitResult);
  } catch (err) {
    console.error("执行上传过程中出现了问题: ", err);
  }
}

// 执行命令
main();
