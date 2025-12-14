import os
from pathlib import Path

def read_docs_from_directory(directory_path, output_file):
    """
    读取指定目录下的所有文档文件并格式化输出到文件
    
    Args:
        directory_path: 目录路径
        output_file: 输出文件路径
    """
    # 转换为Path对象
    docs_path = Path(directory_path)
    
    # 检查目录是否存在
    if not docs_path.exists():
        print(f"错误：目录 '{directory_path}' 不存在")
        return
    
    if not docs_path.is_dir():
        print(f"错误：'{directory_path}' 不是一个目录")
        return
    
    # 获取目录下所有文件
    files = sorted(docs_path.rglob('*'))
    
    # 过滤出文件（排除目录）
    doc_files = [f for f in files if f.is_file()]
    
    if not doc_files:
        print(f"目录 '{directory_path}' 下没有找到任何文件")
        return
    
    # 打开输出文件
    with open(output_file, 'w', encoding='utf-8') as output:
        # 遍历并输出每个文件
        for file_path in doc_files:
            try:
                # 读取文件内容
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 格式化输出 - 使用完整路径
                output.write(f"文件路径：{file_path}\n")
                output.write(f"文件名：{file_path.name}\n")
                output.write(f"文件详情：\n")
                output.write(content)
                output.write("\n" + "="*80 + "\n\n")
                
                # 同时在控制台显示进度
                print(f"已处理：{file_path}")
                
            except UnicodeDecodeError:
                # 如果UTF-8解码失败，尝试其他编码
                try:
                    with open(file_path, 'r', encoding='gbk') as f:
                        content = f.read()
                    output.write(f"文件路径：{file_path}\n")
                    output.write(f"文件名：{file_path.name}\n")
                    output.write(f"文件详情：\n")
                    output.write(content)
                    output.write("\n" + "="*80 + "\n\n")
                    print(f"已处理：{file_path}")
                except Exception as e:
                    output.write(f"文件路径：{file_path}\n")
                    output.write(f"文件名：{file_path.name}\n")
                    output.write(f"读取失败：{str(e)}\n")
                    output.write("\n" + "="*80 + "\n\n")
                    print(f"读取失败：{file_path} - {str(e)}")
            except Exception as e:
                output.write(f"文件路径：{file_path}\n")
                output.write(f"文件名：{file_path.name}\n")
                output.write(f"读取失败：{str(e)}\n")
                output.write("\n" + "="*80 + "\n\n")
                print(f"读取失败：{file_path} - {str(e)}")
    
    print(f"\n所有文件已处理完成，结果已保存到：{output_file}")

if __name__ == "__main__":
    # 指定目录路径和输出文件
    directory = "src/"
    output_file = "output.txt"
    
    read_docs_from_directory(directory, output_file)
