# Zeabur 模板（KodakTV + KVRocks）

本文档用于在 Zeabur 上创建一个「一键部署」模板，包含两个服务：KodakTV 与 KVRocks。

## 服务 1：KodakTV

- 镜像：`ghcr.io/korean032/kodaktv:latest`
- 端口：`3000`（HTTP）
- 环境变量（建议按需填充）：

```
USERNAME=admin
PASSWORD=your_secure_password

# 存储类型与连接（必填）
NEXT_PUBLIC_STORAGE_TYPE=kvrocks
KVROCKS_URL=redis://<kvrocks_service_name>:6666

# 站点可选配置
SITE_BASE=https://your-domain.zeabur.app
NEXT_PUBLIC_SITE_NAME=KodakTV Enhanced
ANNOUNCEMENT=欢迎使用 KodakTV Enhanced Edition

# 豆瓣代理（推荐，可按需调整）
NEXT_PUBLIC_DOUBAN_PROXY_TYPE=cmliussss-cdn-tencent
NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE=cmliussss-cdn-tencent
```

> 提示：`<kvrocks_service_name>` 请替换为 KVRocks 服务在 Zeabur 中的名称（例如 `apachekvrocks`）。

## 服务 2：KVRocks

- 镜像：`apache/kvrocks`
- 端口：`6666`（TCP）
- 持久化卷（必须）：
  - Volume ID：`kvrocks-data`（自定义 ID，字母数字或连字符）
  - Path：`/var/lib/kvrocks/db`

> 重要：必须配置持久化卷到 `/var/lib/kvrocks/db`，保证数据库文件持久化，避免重启/升级丢数据。

## 模板发布步骤

1. 打开 Zeabur，进入你的 Project。
2. 依次通过「Add Service > Docker Images」添加上述两个服务。
3. 在 KodakTV 服务中填入环境变量；在 KVRocks 服务中配置端口与持久化卷。
4. 确保两个服务在同一个 Project，且 `KVROCKS_URL` 使用 KVRocks 的服务名称。
5. 在 Project 或 Space 中创建「Template」，将这两个服务加入模板。
6. 发布模板后，获得模板 ID（形如 `https://zeabur.com/templates/<TEMPLATE_ID>/deploy`）。

## 将模板链接写入 README

获得 `TEMPLATE_ID` 后，替换 README 中的按钮链接为：

```
https://zeabur.com/templates/<TEMPLATE_ID>/deploy
```

完成后，点击 README 里的「Deploy on Zeabur」按钮即可一键部署正确的 KodakTV + KVRocks 环境。