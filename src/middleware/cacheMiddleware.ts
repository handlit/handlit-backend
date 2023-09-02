// cacheMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import {RedisClient} from "../common/redis";

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl;

  const cachedData = await RedisClient.getData(RedisClient.UrlCacheDataPrefix, key)
  if (cachedData) {
    res.json(cachedData);
    return;
  }

  const originalSend = res.json;
  res.json = ((data: any) => {
    if (!data.error)
      RedisClient.setData(RedisClient.UrlCacheDataPrefix, key, data);
    return originalSend.call(res, data);
  }) as typeof res.json;

  next();
};
export const resetCacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl;

  const originalSend = res.json;
  res.json = ((data: any) => {
    if (!data.error) {
      RedisClient.setData(RedisClient.UrlCacheDataPrefix, key, data);
    }
    return originalSend.call(res, data);
  }) as typeof res.json;

  next();
};
