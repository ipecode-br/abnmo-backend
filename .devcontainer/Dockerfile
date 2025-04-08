FROM node:20

# Instalar ferramentas básicas
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Configurar diretório de trabalho
WORKDIR /workspace

# Instalar dependências globais do Node
RUN npm install -g @nestjs/cli

# Mudar para usuário node por segurança
USER node
