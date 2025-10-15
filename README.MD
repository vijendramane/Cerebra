# 🚀 ML Research Agent Testing Platform

A comprehensive fullstack platform for testing and evaluating ML research AI agents on various research tasks including idea generation, proposal writing, experimentation, and paper writing.

![Platform Overview](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![License](https://img.shields.io/badge/License-MIT-green)

## 📌 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### Core Capabilities
- **🤖 Multi-Agent Support**: Test various AI agents (Google Gemini, Groq)
- **📝 Research Tasks**: 
  - Idea Generation
  - Proposal Writing
  - Experiment Design
  - Paper Writing
  - Literature Review
- **🔬 Domain Coverage**: NLP, Computer Vision, Reinforcement Learning
- **📊 Comprehensive Metrics**: Quality scores, completeness, response time
- **🧪 Experiment Management**: Batch testing and comparison
- **📈 Real-time Dashboard**: Monitor agent performance
- **🔐 User Authentication**: Secure multi-user support









## 🏗️ Architecture


─────────────────────────────────────────────────────┐
│ Frontend (Next.js) │
│ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │Dashboard│ │Agent Test│ │Experiment│ │Metrics │ │
│ └─────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
│
API (REST/WebSocket)
│
┌─────────────────────────────────────────────────────┐
│ Backend (FastAPI) │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Auth │ │ Agents │ │ Metrics │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Research Agent Framework │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
│
┌──────────┴──────────┐
│ │
┌───────▼────────┐ ┌───────▼────────┐
│ PostgreSQL │ │ Redis │
└────────────────┘ └────────────────┘
















## 📋 Prerequisites

### Required Software
- **Python 3.9+** (3.9, 3.10, or 3.11 recommended)
- **Node.js 18+** and npm
- **PostgreSQL 14+** (or use Docker)
- **Redis 6+** (or use Docker)
- **Git**

### Optional
- **Docker & Docker Compose** (for containerized setup)

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd ml-research-agent-platform





