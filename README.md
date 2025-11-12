# AgentRun Component

阿里云 AgentRun 智能体运行时组件，用于部署和管理智能体运行时实例。

## 简介

AgentRun Component 是 [Serverless Devs](https://www.serverless-devs.com/) 的一个组件，用于部署和管理阿里云 AgentRun 智能体运行时实例。智能体运行时是 AgentRun 服务的核心组件，提供代码执行、浏览器操作、内存管理等能力。

## 功能特性

- ✅ 支持创建和管理智能体运行时实例
- ✅ 支持代码和容器两种部署模式
- ✅ 支持本地代码、OSS 代码包部署
- ✅ 支持端点（Endpoint）配置和灰度发布
- ✅ 支持 VPC 网络配置
- ✅ 支持公网/内网/混合网络访问
- ✅ 支持环境变量和日志配置
- ✅ 支持自定义 RAM 角色

## 前置要求

- [Serverless Devs](https://www.serverless-devs.com/) 工具已安装
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

### 3. 创建配置文件

创建 `s.yaml` 文件：

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
        code: 
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        cpu: 1.0
        memory: 2048
        port: 8000
```

### 4. 部署

```bash
s deploy
```

## YAML 配置详解

### 基本配置结构

```yaml
edition: 3.0.0          # Serverless Devs 版本
name: agentrun-app      # 应用名称
access: default         # 访问凭证别名

resources:
  my-agent:             # 资源名称
    component: agentrun # 组件名称
    props:              # 组件属性
      region: string    # 地域
      agent: object     # 智能体配置
```

### Agent 配置详解

#### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `name` | String | 智能体运行时名称 | `my-runtime` |
| `code` 或 `customContainerConfig` | Object | 代码配置或容器配置（二选一） | - |

#### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `description` | String | - | 描述信息 |
| `cpu` | Number | 1.0 | CPU 核数 |
| `memory` | Number | 2048 | 内存大小（MB）|
| `diskSize` | Number | 512 | 磁盘大小（MB）|
| `timeout` | Number | 600 | 超时时间（秒）|
| `port` | Number | 8000 | 监听端口 |
| `instanceConcurrency` | Number | 10 | 实例并发数 |
| `internetAccess` | Boolean | true | 是否允许公网访问 |
| `vpcConfig` | Object | - | VPC 配置 |
| `environmentVariables` | Object | - | 环境变量 |
| `role` | String | - | RAM 角色 ARN |
| `logConfig` | Object | - | 日志配置 |
| `endpoints` | Array | - | 端点配置 |

## 配置示例

### 1. 代码模式 - 本地目录

```yaml
resources:
  my-agent:
    component: agentrun
    props:
      region: cn-hangzhou
      agent:
        name: my-runtime
        description: "Python Agent"
        
        # 使用本地目录
        code: 
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        
        # 资源配置
        cpu: 1.0
        memory: 2048
        port: 8000
        instanceConcurrency: 10
        
        # 环境变量
        environmentVariables:
          ENV: production
          LOG_LEVEL: info
        
        # 公网访问
        internetAccess: true
```

### 2. 代码模式 - 本地 ZIP 文件

```yaml
agent:
  name: my-runtime
  code: 
    src: ./code.zip
    language: python3.12
    command:
      - python3
      - main.py
  cpu: 2.0
  memory: 4096
```

### 3. 代码模式 - OSS 代码包

```yaml
agent:
  name: my-runtime
  
  # OSS 代码包
  code:
    ossBucketName: my-code-bucket
    ossObjectName: agent-code.zip
    language: python3.12
    command:
      - python3
      - main.py
  
  cpu: 1.0
  memory: 2048
```

### 4. 容器模式

```yaml
agent:
  name: my-container-runtime
  description: "Container-based Agent"
  
  # 容器配置
  customContainerConfig:
    image: registry.cn-hangzhou.aliyuncs.com/my-namespace/my-agent:latest
    command:
      - python3
      - app.py
    port: 8000
  
  cpu: 2.0
  memory: 4096
  
  # 环境变量
  environmentVariables:
    MODEL_NAME: qwen-max
    API_KEY: ${env(API_KEY)}  # 从环境变量读取
```

### 5. VPC 配置 - 仅内网访问

```yaml
agent:
  name: my-vpc-runtime
  code: 
    src: ./code
    language: python3.12
    command:
      - python3
      - main.py
  
  # VPC 配置
  vpcConfig:
    vpcId: vpc-bp1234567890abcdef
    vSwitchIds:
      - vsw-bp1111111111111111
      - vsw-bp2222222222222222
    securityGroupId: sg-bp1234567890abcdef
  
  # 禁用公网访问（仅内网）
  internetAccess: false
```

### 6. VPC + 公网混合访问

```yaml
agent:
  name: my-hybrid-runtime
  code: 
    src: ./code
    language: python3.12
    command:
      - python3
      - main.py
  
  # VPC 配置
  vpcConfig:
    vpcId: vpc-bp1234567890abcdef
    vSwitchIds: [vsw-bp1111111111111111]
    securityGroupId: sg-bp1234567890abcdef
  
  # 同时允许公网访问
  internetAccess: true
```

### 7. 日志配置

```yaml
agent:
  name: my-runtime
  code: 
    src: ./code
    language: python3.12
    command:
      - python3
      - main.py
  
  # SLS 日志配置
  logConfig:
    project: my-sls-project
    logstore: agentrun-logs
  
  # 执行角色（需要有日志写入权限）
  role: acs:ram::123456789:role/AliyunFCLogRole
```

### 8. 端点配置 - 基本

```yaml
agent:
  name: my-runtime
  code: 
    src: ./code
    language: python3.12
    command:
      - python3
      - main.py
  
  # 端点配置
  endpoints:
    - name: production
      version: 1
      description: "生产环境端点"
    
    - name: staging
      version: 2
      description: "预发布环境"
```

### 9. 端点配置 - 灰度发布

```yaml
agent:
  name: my-runtime
  code: 
    src: ./code
    language: python3.12
    command:
      - python3
      - main.py
  
  endpoints:
    # 稳定版本（80% 流量）
    - name: stable
      version: 1
      description: "稳定版本"
    
    # 灰度版本（20% 流量）
    - name: canary
      version: 2
      description: "金丝雀发布"
      weight: 0.2  # 20% 流量到版本 2
```

### 10. 完整配置示例

```yaml
edition: 3.0.0
name: complete-agent-app
access: default

vars:
  region: cn-hangzhou
  env: production

resources:
  complete-agent:
    component: agentrun
    props:
      region: ${vars.region}
      
      agent:
        # 基本信息
        name: ${vars.env}-agent
        description: "完整配置的智能体运行时"
        
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
        diskSize: 1024
        timeout: 900
        
        # 端口和并发
        port: 8000
        instanceConcurrency: 50
        
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
          API_ENDPOINT: https://api.example.com
          API_KEY: ${env(API_KEY)}
        
        # 执行角色
        role: acs:ram::123456789:role/AliyunAgentRunDefaultRole
        
        # 日志配置
        logConfig:
          project: ${vars.env}-logs
          logstore: agentrun-runtime
        
        # 端点配置
        endpoints:
          - name: production
            version: 1
            description: "生产环境主端点"
          
          - name: canary
            version: 2
            description: "金丝雀测试"
            weight: 0.1
```

## 命令说明

### 部署

部署智能体运行时到云端：

```bash
s deploy
```

部署时显示详细日志：

```bash
s deploy --debug
```

### 查询信息

查看已部署的智能体运行时信息：

```bash
s info
```

输出示例：

```
agent: 
  id:           1062cdd0-042e-407b-8a3f-234370c2c68c
  arn:          acs:agentrun:cn-hangzhou:1583208943291465:runtimes/1062cdd0-042e-407b-8a3f-234370c2c68c
  name:         my-runtime-1109-2
  description:  My Agent Runtime
  artifactType: Code
  status:       READY
  resources: 
    cpu:    1
    memory: 2048
    port:   9000
  timestamps: 
    createdAt:     2025-11-11T07:07:33.833654Z
    lastUpdatedAt: 2025-11-11T07:32:03.674692Z
  region:       cn-hangzhou
  endpoints: 
    []
```

### 删除

删除智能体运行时实例：

```bash
s remove
```

自动确认删除（跳过确认提示）：

```bash
s remove -y
```

## 网络配置说明

### 网络模式对照表

| 配置方式 | 网络模式 | 说明 |
|----------|----------|------|
| `internetAccess: true`<br/>无 `vpcConfig` | 公网 | 仅公网访问 |
| `vpcConfig: {...}`<br/>`internetAccess: false` | 私网 | 仅 VPC 内网访问 |
| `vpcConfig: {...}`<br/>`internetAccess: true` | 混合 | VPC 内网 + 公网都可访问 |

### 网络模式选择建议

- **仅公网访问**：适合快速测试、个人项目
- **仅 VPC 访问**：适合生产环境、需要访问 RDS/Redis 等内网资源
- **混合访问**：适合需要访问内网资源同时对外提供服务的场景

## 环境变量说明

支持多种方式设置环境变量：

### 1. 直接配置

```yaml
environmentVariables:
  ENV: production
  DEBUG: "false"
```

### 2. 引用外部环境变量

```yaml
environmentVariables:
  API_KEY: ${env(API_KEY)}
  DB_PASSWORD: ${env(DB_PASSWORD)}
```

使用前先设置环境变量：

```bash
export API_KEY=your_api_key
export DB_PASSWORD=your_password
s deploy
```

### 3. 使用 .env 文件

创建 `.env` 文件：

```env
API_KEY=your_api_key
DB_PASSWORD=your_password
```

在 `s.yaml` 中引用：

```yaml
environmentVariables:
  API_KEY: ${env(API_KEY)}
  DB_PASSWORD: ${env(DB_PASSWORD)}
```

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
        "agentrun:CreateAgentRuntimeEndpoint",
        "agentrun:UpdateAgentRuntimeEndpoint",
        "agentrun:DeleteAgentRuntimeEndpoint",
        "agentrun:ListAgentRuntimeEndpoints"
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

## 最佳实践

### 1. 代码组织

推荐的项目结构：

```
my-agent-project/
├── s.yaml              # Serverless Devs 配置
├── .env                # 环境变量（不要提交到 Git）
├── .gitignore
├── code/               # 代码目录
│   ├── main.py
│   ├── requirements.txt
│   └── ...
└── README.md
```

### 2. 环境隔离

使用不同的配置文件管理多环境：

```yaml
# s.dev.yaml - 开发环境
edition: 3.0.0
name: dev-agent
resources:
  my-agent:
    props:
      region: cn-hangzhou
      agent:
        name: dev-agent
        code: 
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        cpu: 1.0
        memory: 2048

---
# s.prod.yaml - 生产环境
edition: 3.0.0
name: prod-agent
resources:
  my-agent:
    props:
      region: cn-hangzhou
      agent:
        name: prod-agent
        code: 
          src: ./code
          language: python3.12
          command:
            - python3
            - main.py
        cpu: 2.0
        memory: 4096
```

部署时指定配置文件：

```bash
s deploy -t s.dev.yaml   # 开发环境
s deploy -t s.prod.yaml  # 生产环境
```

### 3. 灰度发布流程

1. 部署新版本并创建灰度端点：

```yaml
endpoints:
  - name: stable
    version: 1
  - name: canary
    version: 2
    weight: 0.1  # 10% 流量
```

2. 观察新版本指标，逐步提高流量：

```yaml
endpoints:
  - name: canary
    version: 2
    weight: 0.5  # 提高到 50%
```

3. 验证通过后，将全部流量切换到新版本：

```yaml
endpoints:
  - name: production
    version: 2
    weight: 1.0  # 100% 流量
```

### 4. 安全建议

- ❌ 不要在配置文件中硬编码敏感信息
- ✅ 使用环境变量或密钥管理服务
- ✅ 使用 `.gitignore` 忽略 `.env` 文件
- ✅ 为不同环境使用不同的 RAM 角色
- ✅ 生产环境启用 VPC 隔离

## 常见问题

### Q: 部署时报错 "agent configuration is required"？

A: 确保在 `props` 下配置了 `agent` 字段，而不是旧版的 `agentRuntime`。

### Q: 如何更新已部署的运行时？

A: 直接修改 `s.yaml` 后再次执行 `s deploy`，组件会自动检测并更新现有实例。

### Q: 端点的 endpointPublicUrl 在哪里？

A: 部署成功后执行 `s info` 可以看到每个端点的公网访问地址。

### Q: 如何配置自定义域名？

A: 目前需要在阿里云控制台配置自定义域名并绑定到端点。

### Q: 代码更新后是否需要删除重建？

A: 不需要，直接 `s deploy` 即可更新代码，运行时会自动重新部署。

### Q: 是否支持多个交换机？

A: 支持，`vSwitchIds` 可以配置为数组：

```yaml
vpcConfig:
  vSwitchIds:
    - vsw-id-1
    - vsw-id-2
```

## 开发调试

如果您想参与组件开发或调试：

1. 克隆仓库并安装依赖：

```bash
git clone <repository-url>
cd agentrun-component
npm install
```

2. 启动代码热更新：

```bash
npm run watch
```

3. 在 `examples` 目录测试：

```bash
cd examples
s deploy --debug
```

4. 代码格式化：

```bash
npm run format
```

## 更新日志

### v1.0.0 (2024-01-01)

- ✨ 支持新的 YAML 配置规范
- ✨ 简化网络配置
- ✨ 优化端点配置
- 🐛 修复代码路径解析问题
- 📝 完善文档和示例

## 相关链接

- [Serverless Devs 官网](https://www.serverless-devs.com/)
- [AgentRun 产品文档](https://docs.agent.run/)
- [问题反馈](https://github.com/devsapp/agentrun)

## 许可证

MIT License

---

如有问题或建议，欢迎提交 [Issue](https://github.com/devsapp/agentrun) 或 [Pull Request](https://github.com/devsapp/agentrun)！