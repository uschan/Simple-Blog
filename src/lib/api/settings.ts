// src/lib/settings.ts
// 这个文件包含一个服务器端函数，用于获取网站设置

'use server'; // 指示这是一个服务器端文件，可以在服务器端渲染和数据获取中使用

import { cache } from 'react'; // 导入 React 的 cache 函数用于缓存数据
// 导入数据库连接函数和Setting模型。
// !!请根据您的实际文件结构调整这里的导入路径!!
import connectDB from '@/lib/db'; // 假设您的数据库连接函数在 src/lib/db.ts
import { Setting } from '@/models'; // 假设您的Setting Mongoose 模型在 src/models/index.ts 或 src/models/Setting.ts 并已正确导出
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames'; // 假设您的常量定义在 src/constants/fieldNames.ts

// 定义网站设置的数据结构接口
// 这与您之前提供的接口定义一致
export interface SiteSettings {
    siteName: string;
    siteDescription: string;
    siteKeywords: string;
    logo: string;
    favicon: string;
    copyright: string;
    socials: Array<{
        name: string;
        url: string;
        icon: string;
    }>;
    analytics: {
        type: 'google' | 'umami'; // 假设类型是这两种之一
        trackingCode: string;
    };
}

/**
 * 获取网站设置的服务器端函数。
 * 在构建阶段（用于静态生成）或服务器端渲染时执行。
 * 通过直接访问数据库来获取设置，避免在构建时发起对自身 API 的 fetch 调用。
 * 使用 React 的 cache 函数缓存结果，减少重复获取。
 *
 * @returns Promise<SiteSettings> 返回网站设置对象
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
    try {
        // 直接连接数据库。在 Next.js 环境中，连接通常会被智能处理，不会每次都建立新连接。
        await connectDB();

        // 直接从数据库的 Setting 集合中获取所有文档
        // .lean() 方法可以使查询结果更轻量，返回普通的 JavaScript 对象而不是 Mongoose 文档
        const settings = await Setting.find().lean();

        // 将从数据库获取的设置列表转换为一个以设置 key 为属性名的对象，方便查找
        // 使用 Record<string, any> 是因为数据库中存储的 value 类型可能是任意的
        const settingsObj: Record<string, any> = {};
        settings.forEach(setting => {
            // 确保 setting.key 是字符串类型，尽管通常模型会保证这一点
            if (typeof setting.key === 'string') {
                 settingsObj[setting.key] = setting.value;
            }
        });

        // 解析存储在数据库中的社交媒体 JSON 字符串
        let socials: Array<{ name: string; url: string; icon: string }> = [];
        try {
             // 检查 STANDARD_FIELD_NAMES.SOCIALS 对应的设置是否存在且是字符串类型
             if (settingsObj[STANDARD_FIELD_NAMES.SOCIALS] && typeof settingsObj[STANDARD_FIELD_NAMES.SOCIALS] === 'string') {
                const parsedSocials = JSON.parse(settingsObj[STANDARD_FIELD_NAMES.SOCIALS]);
                // 验证解析结果是数组，并映射到预期的格式
                if (Array.isArray(parsedSocials)) {
                    // 进一步校验数组中的每个项目，确保安全并符合接口要求
                    socials = parsedSocials.map(item => ({
                         name: typeof item.name === 'string' ? item.name : '',
                         url: typeof item.url === 'string' ? item.url : '',
                         icon: typeof item.icon === 'string' ? item.icon : ''
                    }));
                } else {
                     // 如果解析成功但结果不是数组，记录错误
                     console.error('解析社交媒体数据结果不是数组:', parsedSocials);
                }
            }
        } catch (e) {
            // 解析 JSON 字符串失败时，记录错误并提供默认社交媒体链接
            console.error('解析社交媒体数据失败:', e);
            // 可以选择提供一组默认的社交媒体链接
            socials = [
                { name: 'Twitter', url: 'https://twitter.com/', icon: 'fa-twitter' },
                { name: 'Instagram', url: 'https://instagram.com/', icon: 'fa-instagram' }
                // 根据需要添加更多默认社交媒体
            ];
             // 或者，如果解析失败时不希望显示任何社交媒体，可以使用 socials = [];
        }

        // 构建并返回公开可访问的网站设置对象
        // 从 settingsObj 中获取值，如果某个 key 不存在或值为 falsy，则使用硬编码的默认值
        const publicSettings: SiteSettings = {
            siteName: settingsObj[STANDARD_FIELD_NAMES.SITE_NAME] || '野盐', // 例如，如果 siteName 在数据库中不存在或为空，则使用 '野盐'
            siteDescription: settingsObj[STANDARD_FIELD_NAMES.SITE_DESCRIPTION] || '',
            siteKeywords: settingsObj[STANDARD_FIELD_NAMES.SITE_KEYWORDS] || '',
            logo: settingsObj[STANDARD_FIELD_NAMES.LOGO] || '/images/logo.svg',
            favicon: settingsObj[STANDARD_FIELD_NAMES.FAVICON] || '/images/favicon.ico',
            // 注意：这里使用了模板字符串来包含年份，确保版权年份是最新的
            copyright: settingsObj[STANDARD_FIELD_NAMES.COPYRIGHT] || `© ${new Date().getFullYear()} 野盐. 保留所有权利。`,
            socials, // 使用上面解析或默认的社交媒体数据
            analytics: {
                // 安全获取分析类型和代码，并提供默认值
                type: (settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_TYPE] as 'google' | 'umami' | undefined) || 'google', // 类型断言并提供默认值
                trackingCode: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || ''
            }
        };

        // console.log('从数据库获取设置成功并已处理'); 
        // 添加一个日志，确认这段代码被执行

        return publicSettings;

    } catch (error) {
        // 如果在数据库连接或查询过程中发生任何错误，记录错误并返回一套完整的默认设置，
        // 这样即使后端出现问题，前端至少可以显示一个基本的网站。
        console.error('从数据库获取设置失败:', error);

        // 返回一套完整的默认设置作为回退
        return {
            siteName: '野盐',
            siteDescription: '野盐是一个专注于独特设计和艺术创作的平台，分享原创插画、艺术和设计资讯。',
            siteKeywords: '博客,技术,分享,设计,艺术',
            logo: '/images/logo.svg',
            favicon: '/images/favicon.ico',
            copyright: `© ${new Date().getFullYear()} 野盐. 保留所有权利。`,
            socials: [
                { name: 'Twitter', url: 'https://twitter.com/', icon: 'fa-twitter' },
                { name: 'Instagram', url: 'https://instagram.com/', icon: 'fa-instagram' }
                // 根据需要添加更多默认社交媒体
            ],
            analytics: {
                type: 'google',
                trackingCode: ''
            }
        };
    }
});