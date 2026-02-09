# Codellab - Collaborative Coding Platform

A real-time collaborative coding platform with integrated code execution, contests, and live collaboration features.

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Next.js Web App<br/>Port 3000]
    end
    
    subgraph "Application Layer"
        Web[Codellab Web Service<br/>Next.js API Routes]
        Socket[Socket Service<br/>Port 3001<br/>WebSocket + Yjs]
        Judge[Judge Service<br/>Port 2358<br/>Code Execution]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Port 5432)]
    end
    
    subgraph "Execution Layer"
        Docker[Docker Runtime<br/>Isolated Containers]
        NodeImg[node:20-alpine]
        PythonImg[python:3.9-alpine]
        JavaImg[openjdk:17-jdk-alpine]
        CppImg[gcc:latest]
    end
    
    Client -->|HTTP/REST| Web
    Client -->|WebSocket| Socket
    Web -->|Code Execution| Judge
    Web -->|CRUD Operations| DB
    Socket -->|Persistence| DB
    Judge -->|Spawn Containers| Docker
    Docker --> NodeImg
    Docker --> PythonImg
    Docker --> JavaImg
    Docker --> CppImg
    
    style Client fill:#4CAF50
    style Web fill:#2196F3
    style Socket fill:#FF9800
    style Judge fill:#9C27B0
    style DB fill:#F44336
    style Docker fill:#607D8B
```

## 🔄 Live Update & Synchronization Flow

```mermaid
sequenceDiagram
    participant U1 as User 1 Browser
    participant U2 as User 2 Browser
    participant Socket as Socket Service
    participant YDoc as Yjs Document<br/>(In-Memory)
    participant DB as PostgreSQL
    
    Note over U1,DB: Real-time Collaboration Flow
    
    U1->>Socket: Connect to room via WebSocket
    Socket->>DB: Load existing document state
    DB-->>Socket: Return persisted Yjs state
    Socket->>YDoc: Hydrate Y.Doc from DB
    Socket-->>U1: Send full document state
    
    U2->>Socket: Connect to same room
    Socket-->>U2: Send current Y.Doc state
    
    Note over U1,U2: Live Editing
    U1->>Socket: Send Yjs update (code/notes/drawing)
    Socket->>YDoc: Apply update to server Y.Doc
    Socket->>U2: Broadcast update
    U2->>U2: Apply update locally
    
    Note over Socket,DB: Debounced Persistence (3s delay)
    Socket->>Socket: Start/Reset debounce timer
    Socket->>DB: Persist Y.Doc state after 3s inactivity
    DB-->>Socket: Confirm save
    Socket-->>U1: Emit "saved" event
```

## 📊 Database Schema

```mermaid
erDiagram
    User ||--o{ Room : owns
    User ||--o{ RoomMember : "member of"
    User ||--o{ Permission : has
    User ||--o{ Submission : submits
    User ||--o{ Message : sends
    User ||--o{ CheatLog : "flagged in"
    
    Room ||--o{ RoomMember : contains
    Room ||--o{ File : contains
    Room ||--o{ Message : contains
    Room ||--o{ Permission : defines
    Room ||--|| Drawing : has
    Room ||--|| TipTapDocument : has
    
    Contest ||--o{ ContestQuestion : includes
    Contest ||--o{ ContestParticipant : has
    Contest ||--o{ Submission : receives
    
    Question ||--o{ ContestQuestion : "part of"
    Question ||--o{ TestCase : has
    Question ||--o{ InputDefinition : defines
    Question ||--|| OutputDefinition : defines
    Question ||--o{ Submission : receives
    Question ||--o{ QuestionTag : tagged
    
    Tag ||--o{ QuestionTag : tags
    
    Submission ||--o{ SubmissionEvent : tracks
    Submission ||--o{ CheatLog : "may have"
    
    User {
        string id PK
        string username UK
        string email UK
        string password
        enum role
        datetime createdAt
    }
    
    Room {
        string id PK
        string name
        string inviteCode UK
        string ownerId FK
        boolean isPublic
        int maxParticipants
        string language
    }
    
    File {
        string id PK
        string name
        string path
        string content
        string roomId FK
        datetime updatedAt
    }
    
    Question {
        string id PK
        string title
        string slug UK
        enum difficulty
        int points
        int timeLimit
        int memoryLimit
        string functionName
    }
    
    Submission {
        string id PK
        string code
        string language
        enum status
        int runtime
        int memory
        int passedTests
        int totalTests
    }
```

## 🚀 Code Execution Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Next.js API
    participant Judge as Judge Service
    participant Docker as Docker Runtime
    participant Container as Execution Container
    
    Client->>API: POST /api/judge/run<br/>{code, language, testInput}
    API->>Judge: POST /execute<br/>{code, language, testInput, functionName}
    
    Judge->>Judge: Generate unique runId
    Judge->>Judge: Create temp directory<br/>/tmp/codellab-execution/{runId}
    Judge->>Judge: Write code + driver wrapper
    
    Judge->>Docker: docker run --rm<br/>--network none<br/>--memory 128m<br/>--cpus 0.5<br/>--pids-limit 64
    
    Docker->>Container: Spawn isolated container<br/>(node/python/java/gcc)
    Container->>Container: Compile (if needed)
    Container->>Container: Execute code with test input
    
    alt Success
        Container-->>Docker: stdout: result
        Docker-->>Judge: {success: true, output, runtime}
    else Timeout
        Judge->>Docker: docker kill {containerName}
        Docker-->>Judge: {success: false, status: TIME_LIMIT_EXCEEDED}
    else Runtime Error
        Container-->>Docker: stderr: error
        Docker-->>Judge: {success: false, status: RUNTIME_ERROR}
    end
    
    Judge->>Judge: Cleanup temp files
    Judge-->>API: Return execution result
    API-->>Client: {success, output, runtime, memory, status}
```

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Browser
    participant API as Next.js API
    participant Auth as NextAuth
    participant DB as PostgreSQL
    
    Note over Client,DB: Registration
    Client->>API: POST /api/auth/register<br/>{username, email, password}
    API->>API: Hash password (bcrypt)
    API->>DB: Create User record
    DB-->>API: User created
    API-->>Client: {success: true}
    
    Note over Client,DB: Login
    Client->>API: POST /api/auth/login<br/>{email, password}
    API->>DB: Find user by email
    DB-->>API: User record
    API->>API: Verify password (bcrypt)
    API->>Auth: Create session
    Auth-->>Client: Set session cookie
    
    Note over Client,DB: Authenticated Requests
    Client->>API: GET /api/rooms/my<br/>(with session cookie)
    API->>Auth: Verify session
    Auth-->>API: User session data
    API->>DB: Query user's rooms
    DB-->>API: Room data
    API-->>Client: {rooms: [...]}
```

## 📁 File Management & Synchronization

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant Socket as Socket Service
    participant API as REST API
    participant DB as PostgreSQL
    
    Note over U1,DB: File Creation
    U1->>API: POST /api/files<br/>{name, path, content, roomId}
    API->>API: Check write permission
    API->>DB: Create File record
    DB-->>API: File created
    API-->>U1: {file: {...}}
    
    Note over U1,DB: Real-time Code Editing
    U1->>Socket: code:change event<br/>{fileId, changes, fullContent}
    Socket->>Socket: Check for paste detection<br/>(>50 chars = potential cheat)
    
    alt Large paste detected
        Socket->>DB: Create CheatLog
    end
    
    Socket->>U2: Broadcast code:change
    U2->>U2: Apply changes to editor
    
    Note over U1,DB: File Update (Persistence)
    U1->>API: PUT /api/files<br/>{id, content}
    API->>API: Check write permission
    API->>DB: Update File.content
    DB-->>API: File updated
    API-->>U1: {file: {...}}
    
    Note over U1,DB: File Deletion
    U1->>API: DELETE /api/files?id={fileId}
    API->>DB: Delete File record
    DB-->>API: Deleted
    API-->>U1: {message: "File deleted"}
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Monaco Editor** - Code editor
- **TipTap** - Rich text editor for notes
- **Excalidraw** - Collaborative drawing
- **Dockview** - Panel management
- **Socket.IO Client** - Real-time communication
- **Yjs** - CRDT for collaboration

### Backend Services

#### Codellab Web Service
- **Next.js API Routes** - RESTful API
- **NextAuth** - Authentication
- **Prisma** - ORM for PostgreSQL
- **Zod** - Schema validation
- **bcrypt** - Password hashing

#### Socket Service
- **Socket.IO** - WebSocket server
- **Yjs** - Conflict-free replicated data types
- **Prisma** - Database access

#### Judge Service
- **Express** - HTTP server
- **Docker** - Containerized code execution
- **Supports**: JavaScript, Python, Java, C++

### Database
- **PostgreSQL 15** - Primary database

### DevOps
- **Docker & Docker Compose** - Containerization
- **pnpm** - Package management

## 📦 Services Overview

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Web** | 3000 | Next.js | Main application & REST API |
| **Socket** | 3001 | Socket.IO + Yjs | Real-time collaboration |
| **Judge** | 2358 | Express + Docker | Code execution |
| **PostgreSQL** | 5432 | PostgreSQL 15 | Data persistence |

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- pnpm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Codellab
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
cd codellab
pnpm install
npx prisma migrate deploy
npx prisma db seed
```

5. **Access the application**
- Web App: http://localhost:3000
- Socket Service: http://localhost:3001
- Judge Service: http://localhost:2358

## 📚 API Documentation

Complete API documentation is available in [swagger.yaml](./swagger.yaml).

You can view it using:
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

### Quick API Reference

| Category | Endpoints |
|----------|-----------|
| **Auth** | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` |
| **Rooms** | `/api/rooms`, `/api/rooms/{id}`, `/api/rooms/my`, `/api/rooms/{id}/join` |
| **Files** | `/api/files` (GET, POST, PUT, DELETE) |
| **Questions** | `/api/questions`, `/api/questions/{id}`, `/api/questions/{id}/testcases` |
| **Contests** | `/api/contests`, `/api/contests/{id}` |
| **Judge** | `/api/judge/run`, `/api/judge/submit` |
| **Submissions** | `/api/submissions` |
| **Admin** | `/api/admin/cheat-logs` |

## 🔌 WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:message` | `{content, type, userId, roomId}` | Send chat message |
| `chat:typing` | `{isTyping: boolean}` | Typing indicator |
| `code:change` | `{fileId, changes, roomId}` | Code editor changes |
| `drawing:yjs-update` | `{roomId, update: Uint8Array}` | Drawing updates |
| `tiptap:update` | `{roomId, update: Uint8Array}` | Notes updates |
| `notes:yjs-update` | `{roomId, update: number[]}` | BlockNote updates |
| `user:role-change` | `{roomId, userId, newRole}` | Change user role (admin only) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:users` | `Array<User>` | Updated participant list |
| `chat:history` | `Array<Message>` | Chat message history |
| `chat:message` | `Message` | New chat message |
| `chat:typing` | `{username}` | User started typing |
| `code:change` | `{fileId, changes}` | Code changes from other users |
| `drawing:yjs-update` | `Uint8Array` | Drawing updates |
| `tiptap:update` | `Uint8Array` | Notes updates |
| `user:role-changed` | `User` | User role updated |

## 🎯 Key Features

### Real-time Collaboration
- **Multi-user code editing** with cursor tracking
- **Collaborative notes** using TipTap + Yjs
- **Shared whiteboard** with Excalidraw
- **Live chat** with typing indicators and mentions
- **Permission system** (admin, writer, reader roles)

### Code Execution
- **Multi-language support**: JavaScript, Python, Java, C++
- **Isolated execution** in Docker containers
- **Resource limits**: 128MB memory, 0.5 CPU, 3s timeout
- **Test case validation** with custom inputs/outputs

### Contest System
- **Timed contests** with start/end times
- **Question management** with difficulty levels
- **Leaderboard** with scoring and rankings
- **Submission tracking** with runtime/memory metrics

### Security Features
- **Cheat detection** for paste events and suspicious behavior
- **Network isolation** for code execution containers
- **Permission-based access control**
- **Secure authentication** with bcrypt password hashing

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]
