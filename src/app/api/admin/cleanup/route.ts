export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting } from '@/models';

// 字段映射：旧字段 -> 新字段
const FIELD_MAPPING: Record<string, string> = {
  'siteTitle': 'siteName',
  // 添加其他需要映射的字段
};

// 需要移除的无用字段
const FIELDS_TO_REMOVE: string[] = [
  // 在确认后添加需要删除的字段
];

/**
 * 清理数据库中的冗余字段，统一字段命名
 * 1. 将旧字段值迁移到新字段
 * 2. 删除冗余字段
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const results = {
      migrated: [] as any[],
      removed: [] as any[],
      errors: [] as any[]
    };
    
    // 1. 迁移字段值
    for (const [oldField, newField] of Object.entries(FIELD_MAPPING)) {
      try {
        // 查找旧字段
        const oldSetting = await Setting.findOne({ key: oldField });
        if (oldSetting) {
          // 检查新字段是否存在
          const newSetting = await Setting.findOne({ key: newField });
          
          if (!newSetting) {
            // 如果新字段不存在，创建新字段
            const created = await Setting.create({
              key: newField,
              value: oldSetting.value,
              group: oldSetting.group || 'general'
            });
            results.migrated.push({ from: oldField, to: newField, created: true });
          } else {
            // 如果新字段已存在，但值为空，则更新
            if (!newSetting.value && oldSetting.value) {
              await Setting.updateOne(
                { key: newField },
                { value: oldSetting.value }
              );
              results.migrated.push({ from: oldField, to: newField, updated: true });
            }
          }
          
          // 删除旧字段
          await Setting.deleteOne({ key: oldField });
          results.removed.push({ field: oldField });
        }
      } catch (error) {
        console.error(`迁移字段 ${oldField} 失败:`, error);
        results.errors.push({ field: oldField, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // 2. 删除无用字段
    for (const field of FIELDS_TO_REMOVE) {
      try {
        const result = await Setting.deleteOne({ key: field });
        if (result.deletedCount > 0) {
          results.removed.push({ field });
        }
      } catch (error) {
        console.error(`删除字段 ${field} 失败:`, error);
        results.errors.push({ field, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return NextResponse.json({
      message: '数据库清理完成',
      results
    });
  } catch (error: any) {
    console.error('数据库清理错误:', error);
    return NextResponse.json(
      { message: '数据库清理错误', error: error.message },
      { status: 500 }
    );
  }
} 