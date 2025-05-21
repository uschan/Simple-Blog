// MongoDB设置脚本
// 使用方法: mongosh < setup-mongodb.js

// 创建blog数据库
db = db.getSiblingDB("blog");

// 创建admin用户
db.createUser({
  user: "admin",
  pwd: "jimeng@0301$",
  roles: [
    { role: "readWrite", db: "blog" },
    { role: "dbAdmin", db: "blog" }
  ]
});

// 创建集合
db.createCollection("articles");
db.createCollection("categories");
db.createCollection("comments");
db.createCollection("media");
db.createCollection("settings");
db.createCollection("users");

// 输出创建结果
print("MongoDB初始化完成!");
print("创建的集合:");
db.getCollectionNames().forEach(function(collection) {
  print(" - " + collection);
});
print("\n管理员账户:");
print(" - 用户名: admin");
print(" - 密码: jimeng@0301$");
print("\n接下来可以启动应用程序使用MongoDB!"); 