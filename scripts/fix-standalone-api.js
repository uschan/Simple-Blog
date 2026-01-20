const fs = require('fs');
const path = require('path');

/**
 * Next.js standalone模式构建后修复脚本
 * 包含API路由修复和静态资源复制
 */

// 仅保留重要日志
function log(message) {
  console.log(`🔧 ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

// 获取当前工作目录
const CWD = process.cwd();

// 检查构建目录
if (!fs.existsSync(path.join(CWD, '.next'))) {
  logError('构建目录不存在，请先运行 next build');
  process.exit(1);
}

if (!fs.existsSync(path.join(CWD, '.next/standalone'))) {
  logError('standalone目录不存在，请检查next.config.js配置');
  process.exit(1);
}

// 创建目录
function ensureDirectoryExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch (error) {
    logError(`创建目录失败: ${dir}`);
    return false;
  }
}

// 递归复制文件
function copyFolderRecursiveSync(source, target) {
  if (!ensureDirectoryExists(target)) {
    return false;
  }

  if (!fs.existsSync(source)) {
    logError(`源目录不存在: ${source}`);
    return false;
  }
  
  try {
    const files = fs.readdirSync(source);
    
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      try {
        const stat = fs.statSync(sourcePath);
        
        if (stat.isDirectory()) {
          copyFolderRecursiveSync(sourcePath, targetPath);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
        }
      } catch (error) {
        logError(`复制失败: ${sourcePath}`);
      }
    });
    
    return true;
  } catch (error) {
    logError(`读取目录失败: ${source}`);
    return false;
  }
}

// 复制静态资源
function copyStaticResources() {
  log('复制静态资源...');
  
  const staticSource = path.join(CWD, '.next/static');
  const staticTarget = path.join(CWD, '.next/standalone/.next/static');
  
  const publicSource = path.join(CWD, 'public');
  const publicTarget = path.join(CWD, '.next/standalone/public');
  
  let allSuccess = true;
  
  // 复制 .next/static 目录
  if (fs.existsSync(staticSource)) {
    if (copyFolderRecursiveSync(staticSource, staticTarget)) {
      log('静态文件 ✓');
    } else {
      logError('静态文件 ✗');
      allSuccess = false;
    }
  } else {
    logError('静态文件源目录不存在');
    allSuccess = false;
  }
  
  // 复制 public 目录
  if (fs.existsSync(publicSource)) {
    if (copyFolderRecursiveSync(publicSource, publicTarget)) {
      log('公共资源 ✓');
    } else {
      logError('公共资源 ✗');
      allSuccess = false;
    }
  } else {
    logError('公共资源源目录不存在');
    allSuccess = false;
  }
  
  return allSuccess;
}

// 修复API路由
function fixApiRoutes() {
  log('修复API路由...');
  
  const apiDir = path.join(CWD, '.next/standalone/app/api');
  const nextServerApiDir = path.join(CWD, '.next/standalone/.next/server/app/api');
  
  // 检查是否需要修复
  if (!fs.existsSync(apiDir) && fs.existsSync(nextServerApiDir)) {
    log('修复API目录结构');
    if (copyFolderRecursiveSync(nextServerApiDir, apiDir)) {
      log('API路由 ✓');
      return true;
    } else {
      logError('API路由 ✗');
      return false;
    }
  }
  
  log('API路由正常 ✓');
  return true;
}

// 主执行函数
async function main() {
  try {
    log('开始构建后修复...');
    
    const apiFixed = fixApiRoutes();
    const staticFixed = copyStaticResources();
    
    if (apiFixed && staticFixed) {
      log('✅ 修复完成');
    } else {
      logError('⚠️ 部分修复失败');
    }
    
  } catch (error) {
    logError(`脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行
main();