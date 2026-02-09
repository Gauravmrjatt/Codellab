# Codellab

A collaborative coding platform for technical interviews, coding contests, and peer learning.

## 🏗 System Architecture Overview

**Codellab** is a collaborative coding platform designed for technical interviews, coding contests, and peer learning. The system combines a modern full-stack web application with real-time collaboration tools and a secure remote code execution engine. It enables users to write code, chat, and video call simultaneously in a shared workspace, synchronizing state across all participants in real-time.

## 🔧 Core Components

- **Web Application (`codellab`)**:
  Built with **Next.js**, this is the primary entry point. It handles user authentication (NextAuth), frontend rendering (React/Tailwind), and RESTful API routes for managing resources like Users, Contests, and Problems. It serves the UI including the Monaco Editor and collaborative tools.

- **Real-time Service (`socket-service`)**:
  A dedicated **Node.js/Socket.io** server that manages ephemeral and stateful real-time interactions. It powers the collaborative coding and rich text editing using **Yjs** (CRDTs) to ensure eventual consistency between users. It also handles chat, presence (cursors), and WebRTC signaling for video calls.

- **Judge Service (`judge-service`)**:
  A specialized **Express.js** service responsible for securely executing user-submitted code. It validates inputs and spawns isolated **Docker** containers for supported languages (Python, JavaScript, Java, C++) to run code safely, returning standard output and execution metrics (time/memory).

- **Database (`PostgreSQL`)**:
  The primary persistent storage accessed via **Prisma ORM**. It stores relational data (Users, Rooms, Submissions) as well as snapshots of collaborative documents (Code, Notes) and chat history.

## 🔄 Component Interaction Flow

1.  **User Session**: A user logs in via the **Web App** (Next.js).
2.  **Room Entry**: The user joins a "Room" (Contest or Interview). The frontend connects to the **Socket Service**.
3.  **Collaboration**:
    *   **Editing**: Keystrokes are sent to the **Socket Service** as Yjs updates. The service broadcasts these to other participants and periodically saves snapshots to **PostgreSQL**.
    *   **Communication**: Chat messages and video signaling packets are routed through the **Socket Service**.
4.  **Code Submission**:
    *   The user clicks "Run". The **Web App** sends the code and test cases to the **Judge Service**.
    *   The **Judge Service** spins up a temporary **Docker** container (e.g., `node:20-alpine`).
    *   The code executes within strict memory/CPU limits.
    *   Results (stdout/stderr) are returned to the **Web App** and displayed to the user.

## 📐 Architecture Diagram (Mermaid)

```mermaid
graph TD
    subgraph Client_Side
        Browser[User Browser]
    end

    subgraph Infrastructure
        LB[Load Balancer / Nginx]
    end

    subgraph Application_Layer
        WebApp[Next.js Web App<br/>(Frontend + API)]
        SocketSvc[Socket Service<br/>(Real-time + Collab)]
        JudgeSvc[Judge Service<br/>(Code Execution)]
    end

    subgraph Data_Layer
        DB[(PostgreSQL)]
    end

    subgraph Execution_Layer
        Docker[Docker Containers<br/>(Sandboxed Runners)]
    end

    %% Flow connections
    Browser -->|HTTPS / NextAuth| WebApp
    Browser -->|WSS / Socket.io| SocketSvc
    
    WebApp -->|REST / RPC| JudgeSvc
    WebApp -->|Prisma| DB
    
    SocketSvc -->|Prisma / Persistence| DB
    SocketSvc -.->|Signaling| Browser
    
    JudgeSvc -->|Spawns| Docker
    Docker -->|StdOut / Logs| JudgeSvc
```
