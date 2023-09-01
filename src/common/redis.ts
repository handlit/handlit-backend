import Redis from 'ioredis';

// Redis 클라이언트 설정
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB),
});


// Redis 연결 에러 처리
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Redis 연결 성공 처리
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export interface GoogleToken {
  userId: string;
  email: string;
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}

export class RedisClient {
  static UserDataPrefix = 'User';
  static UserIdPrefix = 'User:UserId';
  static UserEmailAuthPrefix = 'User:EmailAuth';
  static UserPhoneAuthPrefix = 'User:PhoneAuth';
  static UrlCacheDataPrefix = 'URL_CACHE';
  static UserAuthDataPrefix = 'USER_AUTH'
  static UserCalendarDataPrefix = 'USER_CALENDAR';
  static GoogleTokenPrefix = 'Connection:google_token';
  static NotionCodeList = 'Notion:Data:CodeList';
  static NotionTermList = 'Notion:Data:TermList';
  static NotionBlockData = 'Notion:Block';
  static NotionNicknameData = 'NicknameList';
  static ProfilePool = 'ProfilePool';
  static COFFEE_CHAT_DATA = 'COFFEE_CHAT:DATA';
  static COFFEE_CHAT_STATUS = 'COFFEE_CHAT:STATUS';
  static COFFEE_CHAT_SLACK_THREAD = 'COFFEE_CHAT:SLACK';
  static COFFEE_CHAT_ONLINE = 'COFFEE_CHAT:ONLINE';
  static S3BUCKET_PROFILE_LIST = 'S3:PROFILE';

  static DalleImage = 'Dalle:Image';
  static AirTable = 'AirTable';
  static AirTableWithdrawCursor = 'WithdrawCursor';
  static NotionUserList: string = 'Notion:EMPLOYEE:LIST';

  static async setDataNoLimit(group: string, token: string, value: any) {
    await redisClient.set(`${group}:${token}`, JSON.stringify(value));
  }

  static async setData(group: string, token: string, value: any, expire: number = 3600 * 24) {
    await redisClient.setex(`${group}:${token}`, expire, JSON.stringify(value));
  }

  static async getData<T>(group:string, token: string = 'ALL') {
    const data = await redisClient.get(`${group}:${token}`);
    if (data)
      return JSON.parse(data) as T;
    return null;
  }

  static async addListData(group: string, value: any) {
    await redisClient.rpush(group, JSON.stringify(value));
  }

  static async popRListData(group: string) {
    const result = await redisClient.rpop(group);
    if (result)
      return JSON.parse(result);
    return null;
  }

  static async listDataSize(group: string) {
    return redisClient.llen(group);
  }

  static async getListData<T>(group:string) {
    return redisClient.lrange(group, 0, -1);
  }

  static async addHashData(group: string, field: string, value: any) {
    await redisClient.hset(group, field, value);
  }

  static async getHashData<T>(group:string, field: string) {
    return redisClient.hget(group, field);
  }

  static async saveStringMessage(group: string, message: string): Promise<void> {
    // 지정된 리스트에 문자열 메시지를 저장합니다. (리스트의 오른쪽 끝에 추가)
    await redisClient.rpush(group, message);
  }

  static async getLastStringMessages(group: string, size: number): Promise<string[]> {
    // 리스트의 길이를 가져옵니다.
    const length = await redisClient.llen(group);

    // 리스트의 마지막 N개의 항목을 가져옵니다.
    return redisClient.lrange(group, length - size, length - 1);
  }

  static async setAllData(group: string, value: any, expire: number = 3600 * 24) {
    await redisClient.setex(group, expire, JSON.stringify(value));
  }

  static async getAllData<T>(group:string) {
    const data = await redisClient.get(group);
    if (data)
      return JSON.parse(data) as T;
    return null;
  }

  static async deleteData(group: string, token: string) {
    await redisClient.del(`${group}:${token}`);
  }
}
