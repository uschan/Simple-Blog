const fs = require('fs');
const path = require('path');

/**
 * 修复Next.js standalone模式下API路由构建问题的脚本
 * 这个脚本需要在构建后运行
 */

// 详细日志标志
const VERBOSE = true;

function log(message) {
  console.log(`[修复脚本] ${message}`);
}

function logVerbose(message) {
  if (VERBOSE) {
    console.log(`[修复脚本详细] ${message}`);
  }
}

function logError(message) {
  console.error(`[修复脚本错误] ${message}`);
}

// 检查API路由是否存在
log('开始检查和修复API路由...');

// 获取当前工作目录
const CWD = process.cwd();
logVerbose(`当前工作目录: ${CWD}`);

// 定义关键路径
const apiDir = path.join(CWD, '.next/standalone/app/api');
const nextServerApiDir = path.join(CWD, '.next/standalone/.next/server/app/api');
const adminAuthDir = path.join(apiDir, 'admin/auth');
const nextServerAdminAuthDir = path.join(nextServerApiDir, 'admin/auth');

// 检查构建目录是否存在
if (!fs.existsSync(path.join(CWD, '.next'))) {
  logError('构建目录 .next 不存在！请先运行 next build');
  process.exit(1);
}

if (!fs.existsSync(path.join(CWD, '.next/standalone'))) {
  logError('standalone 输出目录不存在！请确保 next.config.js 中设置了 output: "standalone"');
  process.exit(1);
}

// 创建目标目录
function ensureDirectoryExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`创建目录: ${dir}`);
    } else {
      logVerbose(`目录已存在: ${dir}`);
    }
    return true;
  } catch (error) {
    logError(`创建目录失败 ${dir}: ${error.message}`);
    return false;
  }
}

// 递归复制文件
function copyFolderRecursiveSync(source, target) {
  // 确保目标目录存在
  if (!ensureDirectoryExists(target)) {
    return false;
  }

  // 检查源目录是否存在
  if (!fs.existsSync(source)) {
    logError(`源目录不存在: ${source}`);
    return false;
  }
  
  try {
    const files = fs.readdirSync(source);
    let success = true;
    
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      try {
        const stat = fs.statSync(sourcePath);
        
        if (stat.isDirectory()) {
          // 递归复制子目录
          if (!copyFolderRecursiveSync(sourcePath, targetPath)) {
            success = false;
          }
        } else {
          // 复制文件
          fs.copyFileSync(sourcePath, targetPath);
          logVerbose(`复制文件: ${sourcePath} -> ${targetPath}`);
        }
      } catch (error) {
        logError(`处理文件失败 ${sourcePath}: ${error.message}`);
        success = false;
      }
    });
    
    return success;
  } catch (error) {
    logError(`读取目录失败 ${source}: ${error.message}`);
    return false;
  }
}

// 检查并修复主API目录
log('检查API目录结构...');
let apiDirFixed = false;

if (!fs.existsSync(apiDir)) {
  if (fs.existsSync(nextServerApiDir)) {
    log('API路由目录不存在，需要修复...');
    
    if (ensureDirectoryExists(apiDir)) {
      log('开始复制API路由文件...');
      if (copyFolderRecursiveSync(nextServerApiDir, apiDir)) {
        log('API路由复制成功!');
        apiDirFixed = true;
      } else {
        logError('API路由复制失败!');
      }
    }
  } else {
    logError('错误: 未找到API路由源目录，构建可能存在问题!');
  }
} else {
  log('API路由目录已存在，无需创建。');
  apiDirFixed = true;
}

// 特别关注 admin/auth 路由
log('检查管理员认证API路由...');

if (!fs.existsSync(path.join(adminAuthDir, 'route.js'))) {
  if (fs.existsSync(nextServerAdminAuthDir)) {
    log('管理员认证API路由不存在，需要修复...');
    
    if (ensureDirectoryExists(adminAuthDir)) {
      if (copyFolderRecursiveSync(nextServerAdminAuthDir, adminAuthDir)) {
        log('管理员认证API路由复制成功!');
      } else {
        logError('管理员认证API路由复制失败!');
      }
    }
  } else {
    logError('错误: 未找到管理员认证API路由源目录!');
    // 尝试查找 admin 目录
    if (fs.existsSync(path.join(nextServerApiDir, 'admin'))) {
      log('找到了 admin 目录，检查其内容...');
      try {
        const adminContents = fs.readdirSync(path.join(nextServerApiDir, 'admin'));
        log(`admin 目录内容: ${adminContents.join(', ')}`);
      } catch (error) {
        logError(`读取 admin 目录失败: ${error.message}`);
      }
    }
  }
} else {
  log('管理员认证API路由已存在，无需修复。');
}

// 验证修复结果
log('验证修复结果...');

if (fs.existsSync(apiDir)) {
  log('API目录存在: ✓');
  
  // 列出API目录内容
  try {
    const apiContents = fs.readdirSync(apiDir);
    log(`API目录内容: ${apiContents.join(', ')}`);
  } catch (error) {
    logError(`无法读取API目录内容: ${error.message}`);
  }
  
  if (fs.existsSync(path.join(apiDir, 'admin'))) {
    log('admin目录存在: ✓');
    
    // 列出admin目录内容
    try {
      const adminContents = fs.readdirSync(path.join(apiDir, 'admin'));
      log(`admin目录内容: ${adminContents.join(', ')}`);
    } catch (error) {
      logError(`无法读取admin目录内容: ${error.message}`);
    }
    
    if (fs.existsSync(path.join(adminAuthDir, 'route.js'))) {
      log('管理员认证API路由存在: ✓');
      log('修复成功!');
    } else {
      logError('管理员认证API路由不存在: ✗');
    }
  } else {
    logError('admin目录不存在: ✗');
  }
} else {
  logError('API目录不存在: ✗');
}

log('API路由检查和修复过程已完成!'); 