import os

def batch_rename(start_num=1):
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 获取目录下所有文件（排除子目录）
    files = [f for f in os.listdir(script_dir) if os.path.isfile(os.path.join(script_dir, f))]
    
    # 按文件名排序
    files.sort()
    
    # 计数器初始化
    count = start_num
    
    # 遍历并重命名文件
    for filename in files:
        # 跳过Python脚本本身（避免把自己重命名了）
        if filename.endswith('.py'):
            continue
            
        # 获取文件扩展名
        ext = os.path.splitext(filename)[1]
        
        # 构建新文件名
        new_name = f"{count}{ext}"
        
        # 完整的旧路径和新路径
        old_path = os.path.join(script_dir, filename)
        new_path = os.path.join(script_dir, new_name)
        
        # 重命名文件
        try:
            os.rename(old_path, new_path)
            print(f"重命名成功: {filename} -> {new_name}")
            count += 1
        except Exception as e:
            print(f"重命名失败 {filename}: {str(e)}")

if __name__ == "__main__":
    # 询问用户确认
    user_input = input("即将重命名当前目录下所有文件（从97090开始），是否继续？(y/n): ")
    
    if user_input.lower() == 'y':
        batch_rename()
        print("重命名操作完成！")
    else:
        print("操作已取消")