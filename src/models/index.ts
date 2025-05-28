import Article from './article';
import Category from './category';
import Comment from './comment';
import Media from './media';
import Reaction from './reaction';
import Setting from './setting';
import User from './user';
import PageView from './pageView';
import ApiKey from './ApiKey';

// 导出接口
import type { IArticle } from './article';
import type { ICategory } from './category';
import type { IComment } from './comment';
import type { IMedia } from './media';
import type { IReaction } from './reaction';
import type { ISetting } from './setting';
import type { IUser } from './user';
import type { IPageView } from './pageView';
import type { IApiKey } from './ApiKey';

// 导出模型
export {
  Article,
  Category,
  Comment,
  Media,
  Reaction,
  Setting,
  User,
  PageView,
  ApiKey
};

// 导出类型
export type {
  IArticle,
  ICategory,
  IComment,
  IMedia,
  IReaction,
  ISetting,
  IUser,
  IPageView,
  IApiKey
}; 