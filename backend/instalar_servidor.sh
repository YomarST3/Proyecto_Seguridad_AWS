#!/usr/bin/env bash
# ==============================================================================
# SALESIA ENTERPRISE — SCRIPT DE INSTALACIÓN Y ARRANQUE AUTOMÁTICO EN LINUX
# Optimizado para Oracle Cloud Always Free (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
set -e

echo "================================================================="
echo "🛡️ SALESIA ENTERPRISE — DESPLIEGUE EN SERVIDOR LINUX CLOUD"
echo "================================================================="

# 1. Detectar gestor de paquetes
if command -v apt-get > /dev/null; then
    echo "📦 Actualizando paquetes con APT..."
    sudo apt-get update -y
    sudo apt-get install -y python3 python3-pip python3-venv curl git ufw iptables-persistent debian-keyring debian-archive-keyring apt-transport-https
elif command -v dnf > /dev/null; then
    echo "📦 Actualizando paquetes con DNF..."
    sudo dnf update -y
    sudo dnf install -y python3 python3-pip git curl iptables
fi

# 2. Abrir puertos en iptables (Reglas requeridas para Oracle Cloud)
echo "🔓 Configurando puertos 80, 443 y 8000 en el firewall del sistema..."
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 1 -p tcp --dport 8000 -j ACCEPT 2>/dev/null || true

if command -v netfilter-persistent > /dev/null; then
    sudo netfilter-persistent save || true
fi

if command -v ufw > /dev/null; then
    sudo ufw allow 22/tcp || true
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
    sudo ufw allow 8000/tcp || true
fi

# 3. Configurar directorio /opt/salesia
APP_DIR="/opt/salesia"
echo "📁 Preparando directorio de instalación en $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copiar archivos del repositorio
CURRENT_DIR=$(pwd)
if [ "$CURRENT_DIR" != "$APP_DIR/backend" ]; then
    mkdir -p $APP_DIR/backend
    cp -ru ./* $APP_DIR/backend/ 2>/dev/null || cp -r ./* $APP_DIR/backend/
fi

cd $APP_DIR/backend

# 4. Crear y configurar entorno virtual Python
echo "🐍 Instalando dependencias de Python 3.11 en entorno virtual..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 5. Asegurar archivo de variables de entorno (.env)
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env
        echo "⚠️ Se creó el archivo .env desde la plantilla. Asegúrate de configurar la contraseña de Supabase."
    fi
fi

# 6. Instalar y configurar servicio systemd para 24/7 permanente
echo "⚙️ Configurando servicio systemd salesia-backend con reinicio automático..."
sudo cp salesia-backend.service /etc/systemd/system/salesia-backend.service
sudo sed -i "s|User=ubuntu|User=$USER|g" /etc/systemd/system/salesia-backend.service
sudo sed -i "s|/opt/salesia/backend|$APP_DIR/backend|g" /etc/systemd/system/salesia-backend.service

sudo systemctl daemon-reload
sudo systemctl enable salesia-backend
sudo systemctl restart salesia-backend

# 7. Instalar Caddy para HTTPS automático
echo "🔒 Instalando y configurando Caddy (Proxy Inverso con SSL/TLS automático)..."
if command -v apt-get > /dev/null; then
    if ! command -v caddy > /dev/null; then
        curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
        curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
        sudo apt-get update -y
        sudo apt-get install -y caddy
    fi
fi

# 8. Obtener IP pública y configurar dominio automático sslip.io
PUBLIC_IP=$(curl -s https://api.ipify.org || curl -s ifconfig.me || echo "127.0.0.1")
SS_DOMAIN="${PUBLIC_IP}.sslip.io"

echo "🌐 IP Pública detectada: $PUBLIC_IP"
echo "🌐 Dominio SSL automático asignado: $SS_DOMAIN"

# Configurar Caddyfile
cat <<EOF | sudo tee /etc/caddy/Caddyfile
# Caddyfile para SalesIA Enterprise
$SS_DOMAIN, http://$PUBLIC_IP {
    reverse_proxy 127.0.0.1:8000

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF

sudo systemctl enable caddy
sudo systemctl restart caddy

# 9. Verificación de salud
echo "⏳ Esperando inicio de FastAPI..."
sleep 4

if curl -s http://127.0.0.1:8000/api/v1/health | grep -q "healthy"; then
    echo "================================================================="
    echo "🎉 ¡DESPLIEGUE EXITOSO DE SALESIA ENTERPRISE EN EL SERVIDOR CLOUD!"
    echo "================================================================="
    echo "📍 URL Backend Local:   http://127.0.0.1:8000/api/v1"
    echo "📍 URL Backend Pública: https://$SS_DOMAIN/api/v1"
    echo "📍 Documentación Docs:  https://$SS_DOMAIN/api/v1/docs"
    echo "================================================================="
    echo "El backend se mantendrá encendido de forma permanente 24/7"
    echo "y se reiniciará automáticamente ante cualquier error o reinicio."
    echo "================================================================="
else
    echo "⚠️ El servicio aún está iniciando. Verifique los logs con:"
    echo "   sudo journalctl -u salesia-backend -n 50 --no-pager"
fi
