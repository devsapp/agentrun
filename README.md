# AgentRun Component

阿里云 AgentRun 智能体运行时组件，用于部署和管理智能体运行时实例。

## 简介

AgentRun Component 是 [Serverless Devs](https://www.serverless-devs.com/) 的一个组件，用于部署和管理阿里云 AgentRun 智能体运行时实例。智能体运行时提供代码执行、容器运行、网络访问、日志管理等核心能力。

## 功能特性

- ✅ **部署模式**：支持代码模式和容器模式
- ✅ **代码管理**：支持本地代码、ZIP 包、OSS 代码包
- ✅ **版本管理**：支持版本发布和管理
- ✅ **端点管理**：支持创建端点和灰度发布
- ✅ **网络配置**：支持 VPC、公网、混合网络
- ✅ **日志查询**：支持实时日志和历史日志查询
- ✅ **实例管理**：支持实例列表和命令执行
- ✅ **并发控制**：支持预留并发配置
- ✅ **健康检查**：支持自定义健康检查配置

## 前置要求

- [Serverless Devs](https://www.serverless-devs.com/) 工具已安装（版本 >= 3.0.0）
- 已配置阿里云访问凭证（Access Key）
- 拥有 AgentRun 服务的使用权限

## 快速开始

### 1. 安装 Serverless Devs

```bash
npm install -g @serverless-devs/s
```

### 2. 配置访问凭证

```bash
s config add
```

按提示输入：
- AccountID（阿里云账号 ID）
- AccessKeyID
- AccessKeySecret
- 别名（如：default）

### 3. 初始化项目

```bash
# 创建项目目录
mkdir my-agent-project && cd my-agent-project

# 创建代码目录
mkdir code

# 创建示例代码
cat > code/index.py << 'EOF'
#!/usr/bin/env python3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {"message": "Hello from AgentRun!"}
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    port = 8000
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"Server starting on port {port}...")
    server.serve_forever()
EOF
```

### 4. 创建配置文件

创建 `s.yaml`：

```yaml
edition: 3.0.0
name: my-agentrun-app
access: default

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: my-first-agent
        description: "My first agent runtime"
        
        code:
          src: ./code
          language: python3.12
          command:
            - python3
            - index.py
        
        cpu: 1.0
        memory: 2048
        port: 8000
        instanceConcurrency: 10
        
        logConfig: auto
        
        endpoints:
          - name: production
            description: "Production endpoint"
```

### 5. 部署

```bash
s deploy
```

部署成功后，查看信息：

```bash
s info
```

---

## YAML 配置详解

### 基本配置结构

```yaml
edition: 3.0.0          # Serverless Devs 版本（必须 >= 3.0.0）
name: agentrun-app      # 应用名称
access: default         # 访问凭证别名

vars:                   # 全局变量（可选）
  region: cn-hangzhou
  env: production

resources:
  my-agent:             # 资源名称
    component: agentrun # 组件名称
    props:              # 组件属性
      region: string    # 地域
      agent: object     # 智能体配置
```

---

## Agent 配置详解

### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `name` | String | 智能体运行时名称，字母开头，支持字母、数字、下划线、中划线，1-128 字符 | `my-runtime` |
| `code` 或 `customContainerConfig` | Object | 代码配置或容器配置（二选一） | 见下文 |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `description` | String | - | 描述信息，最多 256 字符 |
| `cpu` | Number | 1.0 | CPU 核数，范围：0.05-16 |
| `memory` | Number | 2048 | 内存大小（MB），范围：128-32768 |
| `port` | Number | 8000 | 监听端口，范围：1-65535 |
| `instanceConcurrency` | Number | 10 | 实例并发数，范围：1-200 |
| `sessionIdleTimeoutSeconds` | Number | 3600 | 会话空闲超时（秒），范围：60-86400 |
| `internetAccess` | Boolean | true | 是否允许公网访问 |
| `vpcConfig` | Object | - | VPC 配置 |
| `environmentVariables` | Object | - | 环境变量 |
| `role` | String | - | RAM 角色 ARN |
| `credentialName` | String | - | 访问凭证名称 |
| `logConfig` | Object/String | - | 日志配置，可设置为 `auto` |
| `protocolConfiguration` | Object | - | 协议配置 |
| `healthCheckConfiguration` | Object | - | 健康检查配置 |
| `endpoints` | Array | - | 端点配置 |

---

## 代码配置（Code）

### 基本结构

```yaml
code:
  src: string                  # 本地代码路径（目录或 ZIP）
  # 或
  ossBucketName: string        # OSS 存储桶名称
  ossObjectName: string        # OSS 对象名称
  
  language: string             # 编程语言（必填）
  command: array               # 运行命令（可选）
  checksum: string             # CRC-64 校验值（可选）
```

### 支持的编程语言

- `python3.10`
- `python3.12`
- `nodejs18`
- `nodejs20`
- `java8`
- `java11`
- `custom`

### 示例

#### 本地目录

```yaml
code:
  src: ./code
  language: python3.12
  command:
    - python3
    - main.py
```

#### 本地 ZIP 文件

```yaml
code:
  src: ./code.zip
  language: python3.12
  command:
    - python3
    - main.py
```

#### OSS 代码包

```yaml
code:
  ossBucketName: my-code-bucket
  ossObjectName: agent-code.zip
  language: python3.12
  command:
    - python3
    - main.py
  checksum: "1234567890123456789"  # 可选
```

---

## 容器配置（CustomContainerConfig）

### 基本结构

```yaml
customContainerConfig:
  image: string                # 容器镜像地址（必填）
  command: array               # 运行命令（可选）
  imageRegistryType: string    # 镜像源类型（可选）
  acrInstanceId: string        # ACR 实例 ID（可选）
```

### 镜像源类型

- `ACR` - 阿里云容器镜像服务
- `ACREE` - 阿里云容器镜像服务企业版
- `CUSTOM` - 自定义镜像仓库

### 示例

#### 基本容器配置

```yaml
customContainerConfig:
  image: registry.cn-hangzhou.aliyuncs.com/my-namespace/my-agent:latest
  command:
    - python3
    - app.py
```

#### ACR 企业版

```yaml
customContainerConfig:
  image: my-acr-instance.cn-hangzhou.cr.aliyuncs.com/namespace/image:tag
  imageRegistryType: ACREE
  acrInstanceId: cri-xxxxxxxxxxxxx
  command:
    - python3
    - app.py
```

---

## VPC 配置

### 基本结构

```yaml
vpcConfig:
  vpcId: string                # VPC ID（必填）
  vSwitchIds: string | array   # 交换机 ID（必填，支持单个或多个）
  securityGroupId: string      # 安全组 ID（必填）
```

### 网络模式

| 配置方式 | 网络模式 | 说明 |
|----------|----------|------|
| 无 `vpcConfig`<br/>`internetAccess: true` 或不设置 | **公网** | 仅公网访问 |
| 有 `vpcConfig`<br/>`internetAccess: false` | **私网** | 仅 VPC 内网访问 |
| 有 `vpcConfig`<br/>`internetAccess: true` 或不设置 | **混合** | VPC + 公网都可访问 |

### 示例

#### 单个交换机

```yaml
vpcConfig:
  vpcId: vpc-bp1234567890abcdef
  vSwitchIds: vsw-bp1111111111111111
  securityGroupId: sg-bp1234567890abcdef
```

#### 多个交换机（高可用）

```yaml
vpcConfig:
  vpcId: vpc-bp1234567890abcdef
  vSwitchIds:
    - vsw-bp1111111111111111
    - vsw-bp2222222222222222
  securityGroupId: sg-bp1234567890abcdef
```

#### 仅内网访问

```yaml
vpcConfig:
  vpcId: vpc-bp1234567890abcdef
  vSwitchIds: [vsw-bp1111111111111111]
  securityGroupId: sg-bp1234567890abcdef
internetAccess: false
```

---

## 日志配置

### 方式 1：自动配置（推荐）

```yaml
logConfig: auto
```

组件会自动创建 SLS 项目和日志库，首次部署后会提示替换为实际配置。

### 方式 2：手动配置

```yaml
logConfig:
  project: my-sls-project      # SLS 项目名称
  logstore: agentrun-logs      # SLS 日志库名称
```

---

## 协议配置

```yaml
protocolConfiguration:
  type: HTTP    # 或 HTTPS
```

---

## 健康检查配置

```yaml
healthCheckConfiguration:
  httpGetUrl: /health                # HTTP GET URL，默认 /health
  initialDelaySeconds: 30            # 初始延迟（秒），默认 30
  periodSeconds: 10                  # 检查间隔（秒），默认 30
  timeoutSeconds: 3                  # 超时时间（秒），默认 3
  failureThreshold: 3                # 失败阈值，默认 3
  successThreshold: 1                # 成功阈值，默认 1
```

---

## 端点配置

### 在 YAML 中配置

```yaml
endpoints:
  - name: production               # 端点名称（必填）
    version: 1                     # 目标版本，默认 LATEST
    description: "Production"      # 描述（可选）
  
  - name: staging
    version: LATEST
    description: "Staging environment"
```

**注意**：灰度发布的流量权重不在 YAML 中配置，需要通过命令行操作。

---

## 配置示例

### 1. 代码模式 - 最小配置

```yaml
edition: 3.0.0
name: minimal-agent
access: default

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: my-agent
        code:
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
```

### 2. 代码模式 - 完整配置

```yaml
edition: 3.0.0
name: complete-agent
access: default

vars:
  region: cn-hangzhou
  env: production

resources:
  my-agent:
    component: agentrun
    props:
      region: ${vars.region}
      agent:
        # 基本信息
        name: ${vars.env}-agent
        description: "Production agent runtime"
        
        # 代码配置
        code:
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        
        # 资源配置
        cpu: 2.0
        memory: 4096
        port: 8000
        instanceConcurrency: 50
        sessionIdleTimeoutSeconds: 7200
        
        # 网络配置
        vpcConfig:
          vpcId: vpc-bp1234567890abcdef
          vSwitchIds:
            - vsw-bp1111111111111111
            - vsw-bp2222222222222222
          securityGroupId: sg-bp1234567890abcdef
        internetAccess: true
        
        # 环境变量
        environmentVariables:
          ENVIRONMENT: ${vars.env}
          LOG_LEVEL: info
          API_KEY: ${env(API_KEY)}
        
        # 执行角色
        role: acs:ram::123456789:role/AliyunAgentRunRole
        
        # 凭证名称
        credentialName: my-credential
        
        # 日志配置
        logConfig:
          project: ${vars.env}-logs
          logstore: agentrun-runtime
        
        # 协议配置
        protocolConfiguration:
          type: HTTP
        
        # 健康检查
        healthCheckConfiguration:
          httpGetUrl: /health
          periodSeconds: 30
          timeoutSeconds: 3
        
        # 端点配置
        endpoints:
          - name: production
            version: 1
            description: "Production endpoint"
          
          - name: staging
            version: LATEST
            description: "Staging endpoint"
```

### 3. 容器模式

```yaml
edition: 3.0.0
name: container-agent
access: default

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: my-container-agent
        description: "Container-based agent"
        
        # 容器配置
        customContainerConfig:
          image: registry.cn-hangzhou.aliyuncs.com/my-ns/my-agent:v1.0
          command:
            - python3
            - app.py
          imageRegistryType: ACR
        
        # 资源配置
        cpu: 2.0
        memory: 4096
        port: 9000
        
        # 环境变量
        environmentVariables:
          MODEL_NAME: qwen-max
          API_KEY: ${env(API_KEY)}
        
        # 日志配置
        logConfig: auto
```

### 4. VPC 内网访问

```yaml
edition: 3.0.0
name: vpc-agent
access: default

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: my-vpc-agent
        
        code:
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        
        # VPC 配置
        vpcConfig:
          vpcId: vpc-bp1234567890abcdef
          vSwitchIds: vsw-bp1111111111111111
          securityGroupId: sg-bp1234567890abcdef
        
        # 禁用公网访问
        internetAccess: false
        
        logConfig: auto
```

---

## 命令说明

### deploy - 部署

部署智能体运行时到云端：

```bash
# 基本部署
s deploy

# 显示详细日志
s deploy --debug

# 自动确认（跳过提示）
s deploy -y
```

### info - 查询信息

查看已部署的智能体运行时详细信息：

```bash
s info
```

输出示例：

```
agent: 
  id:           1062cdd0-042e-407b-8a3f-234370c2c68c
  arn:          acs:agentrun:cn-hangzhou:1583208943291465:runtimes/1062cdd0-042e-407b-8a3f-234370c2c68c
  name:         my-runtime
  description:  My Agent Runtime
  artifactType: Code
  status:       READY
  resources: 
    cpu:    1
    memory: 2048
    port:   8000
  timestamps: 
    createdAt:     2025-01-10T07:07:33Z
    lastUpdatedAt: 2025-01-10T08:32:03Z
  region:       cn-hangzhou
  endpoints: 
    - 
      id:          b8db2461-bae3-4a80-aa66-1e2ccbbb7fb6
      name:        production
      url:         https://xxx.agentrun-data.cn-hangzhou.aliyuncs.com/.../invocations
      version:     LATEST
      status:      READY
      description: Production endpoint
```

### build - 构建代码包

使用 FC3 组件构建代码包（支持依赖安装）：

```bash
# 基本构建
s build

# 使用自定义 Dockerfile
s build --dockerfile Dockerfile

# 显示详细日志
s build --debug
```

### remove - 删除

删除智能体运行时实例及所有关联资源：

```bash
# 交互式删除（会提示确认）
s remove

# 自动确认删除
s remove -y

# 显示详细日志
s remove --debug
```

### logs - 日志查询

查询智能体运行时的日志：

```bash
# 查询最近 20 分钟日志
s logs

# 实时日志（类似 tail -f）
s logs --tail

# 指定时间范围
s logs --start-time "2024-01-01 00:00:00" --end-time "2024-01-01 23:59:59"

# 根据请求 ID 过滤
s logs --request-id 1-63f9c123-xxxx

# 根据实例 ID 过滤
s logs --instance-id c-63f9c123-xxxx

# 关键字搜索
s logs --search "error"

# 只看失败日志
s logs --type fail

# 高亮匹配文本
s logs --search "error" --match "error"
```

### instance - 实例管理

管理智能体运行时的实例：

```bash
# 列出所有实例
s instance list

# 在实例中执行命令
s instance exec --instance-id c-xxxx --cmd "ls -lh"

# 进入交互式 shell
s instance exec --instance-id c-xxxx

# 使用自定义 shell
s instance exec --instance-id c-xxxx --shell /bin/sh

# 指定工作目录
s instance exec --instance-id c-xxxx --workdir /app --cmd "pwd"
```

### concurrency - 并发配置

管理预留并发配置：

```bash
# 查询当前并发配置
s concurrency get

# 设置预留并发
s concurrency put --reserved-concurrency 10

# 删除并发配置
s concurrency remove

# 删除时跳过确认
s concurrency remove -y
```

### version - 版本管理

管理智能体运行时的版本：

```bash
# 列出所有版本
s version list

# 发布新版本
s version publish --description "Version 1.0"

# 发布版本（自动生成描述）
s version publish
```

输出示例：

```
✅ Found 2 version(s)

version  description       lastUpdatedAt              
-------  ----------------  ---------------------------
1        Version 1.0       2024-01-01T10:00:00Z      
LATEST   Auto published    2024-01-02T15:30:00Z      
```

### endpoint - 端点管理

管理智能体运行时的访问端点：

```bash
# 列出所有端点
s endpoint list

# 获取端点详情
s endpoint get --endpoint-name production

# 创建/更新端点（指向 LATEST）
s endpoint publish --endpoint-name production --description "Production endpoint"

# 创建/更新端点（指向特定版本）
s endpoint publish --endpoint-name prod-v1 --target-version 1 --description "Production v1"

# 灰度发布（80% v2, 20% v1）
s endpoint publish --endpoint-name canary \
  --target-version 2 \
  --canary-version 1 \
  --weight 0.2 \
  --description "Canary deployment"

# 删除端点
s endpoint remove --endpoint-name staging

# 删除时跳过确认
s endpoint remove --endpoint-name staging -y
```

输出示例：

```
✅ Found 3 endpoint(s)

name        url                                          traffic                    status  
----------  -------------------------------------------  -------------------------  ------
production  https://xxx.agentrun-data.cn-hangzhou...    100% → v2                  READY   
canary      https://xxx.agentrun-data.cn-hangzhou...    80% → v2, 20% → v1         READY   
staging     https://xxx.agentrun-data.cn-hangzhou...    100% → vLATEST             READY   
```

---

## 完整工作流示例

### 场景：从开发到生产的完整流程

```bash
# 1. 开发环境部署
s deploy

# 2. 查看部署信息
s info

# 3. 查看实时日志
s logs --tail

# 4. 测试通过后，发布版本 1
s version publish --description "First production version"

# 5. 创建生产端点（指向版本 1）
s endpoint publish --endpoint-name production --target-version 1 --description "Production endpoint"

# 6. 开发新功能，再次部署（更新 LATEST）
# 修改代码后
s deploy

# 7. 创建灰度端点测试新版本（10% 流量到 LATEST）
s endpoint publish --endpoint-name canary \
  --target-version 1 \
  --canary-version LATEST \
  --weight 0.1 \
  --description "Canary test"

# 8. 观察日志，验证新版本
s logs --tail

# 9. 验证通过后，逐步提高灰度流量
s endpoint publish --endpoint-name canary \
  --target-version 1 \
  --canary-version LATEST \
  --weight 0.5

# 10. 最终发布版本 2
s version publish --description "Second production version"

# 11. 全量切换到版本 2
s endpoint publish --endpoint-name production --target-version 2

# 12. 删除灰度端点
s endpoint remove --endpoint-name canary -y

# 13. 查看最终状态
s info
s endpoint list
```

---

## 环境变量

支持多种方式设置环境变量：

### 1. 直接配置

```yaml
environmentVariables:
  ENV: production
  DEBUG: "false"
  PORT: "8000"
```

### 2. 引用外部环境变量

```yaml
environmentVariables:
  API_KEY: ${env(API_KEY)}
  DB_PASSWORD: ${env(DB_PASSWORD)}
  DB_HOST: ${env(DB_HOST)}
```

使用前先设置：

```bash
export API_KEY=your_api_key
export DB_PASSWORD=your_password
export DB_HOST=127.0.0.1
s deploy
```

### 3. 使用 .env 文件

创建 `.env` 文件：

```env
API_KEY=your_api_key
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
```

在 `.gitignore` 中忽略：

```
.env
```

在 `s.yaml` 中引用：

```yaml
environmentVariables:
  API_KEY: ${env(API_KEY)}
  DB_PASSWORD: ${env(DB_PASSWORD)}
  DB_HOST: ${env(DB_HOST)}
```

---

## 权限配置

### 所需的 RAM 权限

部署和管理 AgentRun 需要以下权限：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "agentrun:CreateAgentRuntime",
        "agentrun:UpdateAgentRuntime",
        "agentrun:DeleteAgentRuntime",
        "agentrun:GetAgentRuntime",
        "agentrun:ListAgentRuntimes",
        "agentrun:PublishRuntimeVersion",
        "agentrun:ListAgentRuntimeVersions",
        "agentrun:CreateAgentRuntimeEndpoint",
        "agentrun:UpdateAgentRuntimeEndpoint",
        "agentrun:DeleteAgentRuntimeEndpoint",
        "agentrun:GetAgentRuntimeEndpoint",
        "agentrun:ListAgentRuntimeEndpoints"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "fc:GetFunction",
        "fc:GetTempBucketToken"
      ],
      "Resource": "*"
    }
  ]
}
```

### 执行角色权限

如果配置了日志服务，执行角色需要以下权限：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "log:PostLogStoreLogs"
      ],
      "Resource": "*"
    }
  ]
}
```

如果访问 VPC 内的资源，执行角色需要相应的网络权限。

---

## 最佳实践

### 1. 项目结构

推荐的项目结构：

```
my-agent-project/
├── .env                    # 环境变量（不要提交到 Git）
├── .gitignore             # Git 忽略文件
├── s.yaml                 # Serverless Devs 配置
├── s.dev.yaml             # 开发环境配置
├── s.prod.yaml            # 生产环境配置
├── code/                  # 代码目录
│   ├── main.py
│   ├── requirements.txt
│   ├── utils/
│   └── ...
├── tests/                 # 测试代码
└── README.md
```

`.gitignore` 内容：

```
.env
.s/
node_modules/
*.pyc
__pycache__/
.DS_Store
```

### 2. 多环境管理

使用不同的配置文件管理多环境：

**s.dev.yaml** - 开发环境：

```yaml
edition: 3.0.0
name: dev-agent
access: default

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: dev-agent
        code:
          src: ./code
          language: python3.12
          command: [python3, main.py]
        cpu: 1.0
        memory: 2048
        logConfig: auto
```

**s.prod.yaml** - 生产环境：

```yaml
edition: 3.0.0
name: prod-agent
access: prod-account

resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: prod-agent
        code:
          src: ./code
          language: python3.12
          command: [python3, main.py]
        cpu: 2.0
        memory: 4096
        vpcConfig:
          vpcId: vpc-prod
          vSwitchIds: [vsw-prod-1, vsw-prod-2]
          securityGroupId: sg-prod
        internetAccess: false
        logConfig:
          project: prod-logs
          logstore: agentrun
```

部署时指定配置文件：

```bash
# 开发环境
s deploy -t s.dev.yaml

# 生产环境
s deploy -t s.prod.yaml
```

### 3. 灰度发布流程

完整的灰度发布流程：

```bash
# 1. 部署新版本（更新 LATEST）
s deploy

# 2. 发布新版本
s version publish --description "New feature: xxx"

# 3. 创建灰度端点（10% 流量）
s endpoint publish --endpoint-name canary \
  --target-version 1 \
  --canary-version 2 \
  --weight 0.1 \
  --description "Canary: 10% traffic"

# 4. 观察指标和日志
s logs --tail

# 5. 逐步提高流量（50%）
s endpoint publish --endpoint-name canary \
  --target-version 1 \
  --canary-version 2 \
  --weight 0.5

# 6. 全量切换
s endpoint publish --endpoint-name production --target-version 2

# 7. 清理灰度端点
s endpoint remove --endpoint-name canary -y
```

### 4. 健康检查最佳实践

在代码中实现健康检查端点：

**Python 示例：**

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            # 健康检查逻辑
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "version": "1.0"}
            self.wfile.write(json.dumps(response).encode())
        else:
            # 业务逻辑
            pass
```

在 YAML 中配置：

```yaml
healthCheckConfiguration:
  httpGetUrl: /health
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 3
  failureThreshold: 3
  successThreshold: 1
```

### 5. 安全建议

- ✅ **使用环境变量**：不要在配置文件中硬编码敏感信息
- ✅ **使用 .gitignore**：忽略 `.env` 文件
- ✅ **生产环境使用 VPC**：启用内网隔离
- ✅ **最小权限原则**：为不同环境使用不同的 RAM 角色
- ✅ **启用健康检查**：及时发现服务异常
- ✅ **配置日志服务**：便于问题排查
- ✅ **使用版本管理**：支持快速回滚

---

## 常见问题

### Q1: 部署时报错 "agent configuration is required"？

**A**: 确保在 `props` 下配置了 `agent` 字段：

```yaml
props:
  region: cn-hangzhou
  agent:  # ← 必须有这一层
    name: my-agent
    code: ...
```

### Q2: 如何更新已部署的运行时？

**A**: 直接修改 `s.yaml` 后再次执行 `s deploy`，组件会自动检测并更新现有实例。

### Q3: 端点的 URL 在哪里查看？

**A**: 部署成功后执行以下命令查看：

```bash
s info
# 或
s endpoint list
```

### Q4: 代码更新后是否需要删除重建？

**A**: 不需要，直接 `s deploy` 即可更新代码。

### Q5: 如何查看实时日志？

**A**: 使用 tail 模式：

```bash
s logs --tail
```

### Q6: 如何在实例中执行命令？

**A**: 首先获取实例 ID，然后执行命令：

```bash
# 获取实例 ID
s instance list

# 执行命令
s instance exec --instance-id c-xxxx --cmd "ls -lh"
```

### Q7: 灰度发布如何配置？

**A**: 使用 endpoint publish 命令：

```bash
s endpoint publish --endpoint-name canary \
  --target-version 2 \
  --canary-version 1 \
  --weight 0.2 \
  --description "20% to v1, 80% to v2"
```

### Q8: 如何配置多个交换机？

**A**: 使用数组格式：

```yaml
vpcConfig:
  vSwitchIds:
    - vsw-id-1
    - vsw-id-2
```

### Q9: logConfig: auto 是什么意思？

**A**: 自动创建 SLS 日志配置，首次部署后会提示实际的 project 和 logstore 名称。

### Q10: 如何快速回滚到之前的版本？

**A**: 使用 endpoint 切换版本：

```bash
# 查看可用版本
s version list

# 切换到旧版本
s endpoint publish --endpoint-name production --target-version 1
```

---

## 开发调试

如果您想参与组件开发或调试：

### 1. 克隆仓库

```bash
git clone https://github.com/devsapp/agentrun.git
cd agentrun
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发模式

```bash
npm run watch
```

### 4. 测试

在 `test/` 目录创建测试配置：

```yaml
edition: 3.0.0
name: test-app
access: default

resources:
  test-agent:
    component: ${path('../dist')}  # 指向本地构建目录
    props:
      region: cn-hangzhou
      agent:
        name: test-agent
        code:
          src: ./code
          language: python3.12
          command: [python3, main.py]
```

执行测试：

```bash
cd test
s deploy --debug
```

### 5. 代码格式化

```bash
npm run format
```

### 6. 构建发布

```bash
npm run build
```

---

## 更新日志

### v1.0.0 (2025-01-01)

- ✨ 首次发布
- ✨ 支持代码模式和容器模式
- ✨ 支持版本管理和端点管理
- ✨ 支持日志查询和实例管理
- ✨ 支持并发配置
- ✨ 支持 VPC 网络配置
- ✨ 支持健康检查配置
- ✨ 完善文档和示例

---

## 相关链接

- [Serverless Devs 官网](https://www.serverless-devs.com/)
- [Serverless Devs 文档](https://docs.serverless-devs.com/)
- [AgentRun 产品文档](https://help.aliyun.com/product/agentrun)
- [问题反馈](https://github.com/devsapp/agentrun/issues)
- [贡献指南](https://github.com/devsapp/agentrun/blob/main/CONTRIBUTING.md)

---

## 许可证

MIT License

---

## 贡献

欢迎贡献代码和提出建议！

- 提交 [Issue](https://github.com/devsapp/agentrun/issues)
- 提交 [Pull Request](https://github.com/devsapp/agentrun/pulls)
- 加入钉钉群：xxxxx

---

**感谢使用 AgentRun Component！**

如有问题，欢迎随时反馈。